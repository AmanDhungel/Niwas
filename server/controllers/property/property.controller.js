import property_model from "../../models/property/property.model.js";
import {
  upload_file_to_s3,
  delete_file_from_s3,
  build_s3_key,
  clear_temp_files,
} from "../../utils/s3.util.js";

const isEmptyValue = (value) => {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
};

const sanitizePayload = (payload) => {
  const cleaned = {};
  for (const [key, value] of Object.entries(payload)) {
    if (!isEmptyValue(value)) cleaned[key] = value;
  }
  return cleaned;
};

const upload_files_to_s3_batch = async (files, entity, id, folder) => {
  const results = [];
  for (const file of files) {
    const key = build_s3_key(entity, id, folder, file.filename);
    const uploaded = await upload_file_to_s3(file, key);
    results.push({ url: uploaded.url, key: uploaded.key });
  }
  return results;
};

const delete_s3_keys = async (keys = []) => {
  for (const key of keys) {
    if (key) await delete_file_from_s3(key);
  }
};

const processFloorLevelImages = async (
  imageFiles,
  indices,
  floorIndex,
  floorName,
  imageType,
  propertyId,
) => {
  const uploaded = [];
  const safeName = floorName.replace(/[^a-zA-Z0-9]/g, "_");
  const folder = `unit_structure/floor_${floorIndex}_${safeName}/${imageType}`;

  for (const fileIndex of indices) {
    if (fileIndex < 0 || fileIndex >= imageFiles.length) continue;
    const file = imageFiles[fileIndex];
    if (!file) continue;
    const key = build_s3_key(
      "property",
      propertyId.toString(),
      folder,
      file.filename,
    );
    const result = await upload_file_to_s3(file, key);
    uploaded.push({ url: result.url, key: result.key });
  }
  return uploaded;
};

const handleUnmappedFiles = async (
  imageFiles,
  unitStructure,
  propertyId,
  indicesKey,
  imageType,
) => {
  const usedIndices = new Set(
    unitStructure.flatMap((f) => f[indicesKey] || []),
  );
  const unmapped = imageFiles.filter((_, i) => !usedIndices.has(i));
  for (const file of unmapped) {
    const key = build_s3_key(
      "property",
      propertyId.toString(),
      `unit_structure/unmapped_${imageType}`,
      file.filename,
    );
    await upload_file_to_s3(file, key);
  }
};

/* ================= GET ALL PROPERTIES ================= */
export const handle_get_properties = async (req, res) => {
  try {
    const { draft } = req.query;

    const filter = {};
    if (draft === "true") filter.is_draft = true;
    else if (draft === "false") filter.is_draft = false;
    // if no ?draft param, return all

    const properties = await property_model
      .find(filter)
      .populate("property_ownership.property_manager");

    return res.status(200).json({
      status: "success",
      message: "Properties retrieved successfully.",
      data: properties,
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error.",
      error: err.message,
    });
  }
};

/* ================= GET PROPERTY BY ID ================= */
export const handle_get_property_by_id = async (req, res) => {
  try {
    const { property_id } = req.params;

    const property = await property_model
      .findById(property_id)
      .populate("property_ownership.property_manager");

    if (!property) {
      return res.status(404).json({
        status: "error",
        message: "Property not found.",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Property retrieved successfully.",
      data: property,
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error.",
      error: err.message,
    });
  }
};

/* ================= SAVE AS DRAFT ================= */
export const handle_save_property_draft = async (req, res) => {
  try {
    const {
      basic_info,
      location,
      property_details,
      media_and_files,
      amenities,
      publishing,
      property_ownership,
      financial,
      legal_and_insurance,
      unit_structure,
      parking_management,
      utilities_assignment,
    } = req.body;

    const rawPayload = {
      basic_info: JSON.parse(basic_info || "{}"),
      location: JSON.parse(location || "{}"),
      property_details: JSON.parse(property_details || "{}"),
      media_and_files: JSON.parse(media_and_files || "{}"),
      amenities: JSON.parse(amenities || "[]"),
      publishing: JSON.parse(publishing || "{}"),
      property_ownership: JSON.parse(property_ownership || "{}"),
      financial: JSON.parse(financial || "{}"),
      legal_and_insurance: JSON.parse(legal_and_insurance || "{}"),
      unit_structure: JSON.parse(unit_structure || "[]"),
      parking_management: JSON.parse(parking_management || "{}"),
      utilities_assignment: JSON.parse(utilities_assignment || "[]"),
    };

    const cleanedPayload = sanitizePayload(rawPayload);

    const property = await property_model.create({
      is_draft: true,
      basic_info: cleanedPayload.basic_info || {},
      location: cleanedPayload.location || {},
      property_details: cleanedPayload.property_details || {},
      media_and_files: {
        property_photos: [],
        property_videos: [],
        floor_plans_and_layouts: [],
        legal_documents: [],
        insurance_papers: [],
        media_organization:
          cleanedPayload.media_and_files?.media_organization || {},
      },
      amenities: cleanedPayload.amenities || [],
      publishing: {
        ...cleanedPayload.publishing,
        publishing_status: "draft",
      },
      property_ownership: cleanedPayload.property_ownership || {},
      financial: cleanedPayload.financial || {},
      legal_and_insurance: cleanedPayload.legal_and_insurance || {},
      unit_structure: cleanedPayload.unit_structure || [],
      parking_management: cleanedPayload.parking_management || {
        enabled: false,
        spaces: [],
      },
      utilities_assignment: cleanedPayload.utilities_assignment || [],
    });

    const files = req.files || {};
    const id = property._id.toString();

    const topLevelFields = [
      "property_photos",
      "property_videos",
      "floor_plans_and_layouts",
      "legal_documents",
      "insurance_papers",
    ];

    for (const field of topLevelFields) {
      const uploaded = await upload_files_to_s3_batch(
        files[field] || [],
        "property",
        id,
        field,
      );
      property.media_and_files[field] = uploaded.map((u) => ({
        url: u.url,
        key: u.key,
      }));
    }

    const furnitureFiles = files.furniture_images || [];
    const floorImageFiles = files.floor_images || [];

    if (
      (furnitureFiles.length > 0 || floorImageFiles.length > 0) &&
      cleanedPayload.unit_structure?.length > 0
    ) {
      for (let i = 0; i < property.unit_structure.length; i++) {
        const floorData = cleanedPayload.unit_structure[i];
        const floorName = floorData.floor?.name || `floor_${i}`;

        const furnitureIndices = floorData.furniture_image_indices || [];
        if (furnitureFiles.length > 0 && furnitureIndices.length > 0) {
          const uploaded = await processFloorLevelImages(
            furnitureFiles,
            furnitureIndices,
            i,
            floorName,
            "furniture_images",
            id,
          );
          property.unit_structure[i].floor.furniture_images = uploaded.map(
            (u) => ({ url: u.url, key: u.key }),
          );
        }

        const floorImgIndices = floorData.floor_image_indices || [];
        if (floorImageFiles.length > 0 && floorImgIndices.length > 0) {
          const uploaded = await processFloorLevelImages(
            floorImageFiles,
            floorImgIndices,
            i,
            floorName,
            "floor_images",
            id,
          );
          property.unit_structure[i].floor.floor_images = uploaded.map((u) => ({
            url: u.url,
            key: u.key,
          }));
        }
      }

      await handleUnmappedFiles(
        furnitureFiles,
        cleanedPayload.unit_structure,
        id,
        "furniture_image_indices",
        "furniture_images",
      );
      await handleUnmappedFiles(
        floorImageFiles,
        cleanedPayload.unit_structure,
        id,
        "floor_image_indices",
        "floor_images",
      );
    }

    await property.save();
    clear_temp_files(req.files);

    return res.status(201).json({
      status: "success",
      message: "Property saved as draft successfully.",
      data: property,
    });
  } catch (err) {
    clear_temp_files(req.files);
    return res.status(500).json({
      status: "error",
      message: "Internal server error.",
      error: err.message,
    });
  }
};

/* ================= UPDATE DRAFT ================= */
export const handle_update_property_draft = async (req, res) => {
  try {
    const { property_id } = req.params;

    const property = await property_model.findById(property_id);
    if (!property) {
      clear_temp_files(req.files);
      return res
        .status(404)
        .json({ status: "error", message: "Property not found." });
    }

    if (!property.is_draft) {
      clear_temp_files(req.files);
      return res.status(400).json({
        status: "error",
        message: "This property is not a draft. Use the edit endpoint instead.",
      });
    }

    const {
      basic_info,
      location,
      property_details,
      media_and_files,
      amenities,
      publishing,
      property_ownership,
      financial,
      legal_and_insurance,
      unit_structure,
      parking_management,
      utilities_assignment,
      existing_property_photos,
      existing_property_videos,
      existing_floor_plans_and_layouts,
      existing_legal_documents,
      existing_insurance_papers,
    } = req.body;

    const rawPayload = {
      basic_info: JSON.parse(basic_info || "{}"),
      location: JSON.parse(location || "{}"),
      property_details: JSON.parse(property_details || "{}"),
      media_and_files: JSON.parse(media_and_files || "{}"),
      amenities: JSON.parse(amenities || "[]"),
      publishing: JSON.parse(publishing || "{}"),
      property_ownership: JSON.parse(property_ownership || "{}"),
      financial: JSON.parse(financial || "{}"),
      legal_and_insurance: JSON.parse(legal_and_insurance || "{}"),
      unit_structure: JSON.parse(unit_structure || "[]"),
      parking_management: JSON.parse(parking_management || "{}"),
      utilities_assignment: JSON.parse(utilities_assignment || "[]"),
    };

    const cleanedPayload = sanitizePayload(rawPayload);
    const files = req.files || {};
    const id = property._id.toString();

    const topLevelFields = [
      { field: "property_photos", existing: existing_property_photos },
      { field: "property_videos", existing: existing_property_videos },
      {
        field: "floor_plans_and_layouts",
        existing: existing_floor_plans_and_layouts,
      },
      { field: "legal_documents", existing: existing_legal_documents },
      { field: "insurance_papers", existing: existing_insurance_papers },
    ];

    if (!cleanedPayload.media_and_files) cleanedPayload.media_and_files = {};

    for (const { field, existing } of topLevelFields) {
      const keptUrls = existing ? JSON.parse(existing) : [];
      const current = property.media_and_files[field] || [];
      const removed = current.filter(
        (item) => !keptUrls.includes(item.url ?? item),
      );
      await delete_s3_keys(removed.map((item) => item.key).filter(Boolean));
      const kept = current.filter((item) =>
        keptUrls.includes(item.url ?? item),
      );
      const newUploads = await upload_files_to_s3_batch(
        files[field] || [],
        "property",
        id,
        field,
      );
      cleanedPayload.media_and_files[field] = [
        ...kept,
        ...newUploads.map((u) => ({ url: u.url, key: u.key })),
      ];
    }

    // Keep publishing_status as draft while updating
    if (cleanedPayload.publishing) {
      cleanedPayload.publishing.publishing_status = "draft";
    }

    const updated_property = await property_model.findByIdAndUpdate(
      property_id,
      { $set: cleanedPayload },
      { new: true },
    );

    clear_temp_files(req.files);

    return res.status(200).json({
      status: "success",
      message: "Draft updated successfully.",
      data: updated_property,
    });
  } catch (err) {
    clear_temp_files(req.files);
    return res.status(500).json({
      status: "error",
      message: "Internal server error.",
      error: err.message,
    });
  }
};

/* ================= PUBLISH DRAFT ================= */
export const handle_publish_draft = async (req, res) => {
  try {
    const { property_id } = req.params;

    const property = await property_model.findById(property_id);
    if (!property) {
      return res
        .status(404)
        .json({ status: "error", message: "Property not found." });
    }

    if (!property.is_draft) {
      return res.status(400).json({
        status: "error",
        message: "This property is already published.",
      });
    }

    property.is_draft = false;
    property.publishing.publishing_status = "published";
    await property.save();

    return res.status(200).json({
      status: "success",
      message: "Property published successfully.",
      data: property,
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error.",
      error: err.message,
    });
  }
};

/* ================= QUICK SETUP ================= */
export const handle_property_quick_setup = async (req, res) => {
  try {
    const {
      basic_info,
      location,
      property_details,
      media_and_files,
      amenities,
      publishing,
    } = req.body;

    const rawPayload = {
      basic_info: JSON.parse(basic_info || "{}"),
      location: JSON.parse(location || "{}"),
      property_details: JSON.parse(property_details || "{}"),
      media_and_files: JSON.parse(media_and_files || "{}"),
      amenities: JSON.parse(amenities || "[]"),
      publishing: JSON.parse(publishing || "{}"),
    };

    const cleanedPayload = sanitizePayload(rawPayload);

    const property = await property_model.create({
      is_draft: false,
      basic_info: cleanedPayload.basic_info || {},
      location: cleanedPayload.location || {},
      property_details: cleanedPayload.property_details || {},
      media_and_files: {
        property_photos: [],
        property_videos: [],
        floor_plans_and_layouts: [],
        legal_documents: [],
        insurance_papers: [],
        media_organization:
          cleanedPayload.media_and_files?.media_organization || {},
      },
      amenities: cleanedPayload.amenities || [],
      publishing: cleanedPayload.publishing || {},
    });

    const files = req.files || {};
    const id = property._id.toString();

    const topLevelFields = [
      "property_photos",
      "property_videos",
      "floor_plans_and_layouts",
      "legal_documents",
      "insurance_papers",
    ];

    for (const field of topLevelFields) {
      const uploaded = await upload_files_to_s3_batch(
        files[field] || [],
        "property",
        id,
        field,
      );
      property.media_and_files[field] = uploaded.map((u) => ({
        url: u.url,
        key: u.key,
      }));
    }

    await property.save();
    clear_temp_files(req.files);

    return res.status(201).json({
      status: "success",
      message: "Property quick setup completed successfully.",
      data: property,
    });
  } catch (err) {
    clear_temp_files(req.files);
    return res.status(500).json({
      status: "error",
      message: "Internal server error.",
      error: err.message,
    });
  }
};

/* ================= EDIT PROPERTY (QUICK SETUP) ================= */
export const handle_edit_property_quick_setup = async (req, res) => {
  try {
    const { property_id } = req.params;

    const property = await property_model.findById(property_id);
    if (!property) {
      clear_temp_files(req.files);
      return res
        .status(404)
        .json({ status: "error", message: "Property not found." });
    }

    const {
      basic_info,
      location,
      property_details,
      media_and_files,
      amenities,
      publishing,
      existing_property_photos,
      existing_property_videos,
      existing_floor_plans_and_layouts,
      existing_legal_documents,
      existing_insurance_papers,
    } = req.body;

    const rawPayload = {
      basic_info: JSON.parse(basic_info || "{}"),
      location: JSON.parse(location || "{}"),
      property_details: JSON.parse(property_details || "{}"),
      media_and_files: JSON.parse(media_and_files || "{}"),
      amenities: JSON.parse(amenities || "[]"),
      publishing: JSON.parse(publishing || "{}"),
    };

    const cleanedPayload = sanitizePayload(rawPayload);
    const files = req.files || {};
    const id = property._id.toString();

    const topLevelFields = [
      { field: "property_photos", existing: existing_property_photos },
      { field: "property_videos", existing: existing_property_videos },
      {
        field: "floor_plans_and_layouts",
        existing: existing_floor_plans_and_layouts,
      },
      { field: "legal_documents", existing: existing_legal_documents },
      { field: "insurance_papers", existing: existing_insurance_papers },
    ];

    if (!cleanedPayload.media_and_files) cleanedPayload.media_and_files = {};

    for (const { field, existing } of topLevelFields) {
      const keptUrls = existing ? JSON.parse(existing) : [];
      const current = property.media_and_files[field] || [];
      const removed = current.filter(
        (item) => !keptUrls.includes(item.url ?? item),
      );
      await delete_s3_keys(removed.map((item) => item.key).filter(Boolean));
      const kept = current.filter((item) =>
        keptUrls.includes(item.url ?? item),
      );
      const newUploads = await upload_files_to_s3_batch(
        files[field] || [],
        "property",
        id,
        field,
      );
      cleanedPayload.media_and_files[field] = [
        ...kept,
        ...newUploads.map((u) => ({ url: u.url, key: u.key })),
      ];
    }

    const updated_property = await property_model.findByIdAndUpdate(
      property_id,
      { $set: cleanedPayload },
      { new: true },
    );

    clear_temp_files(req.files);

    return res.status(200).json({
      status: "success",
      message: "Property (quick setup) updated successfully.",
      data: updated_property,
    });
  } catch (err) {
    clear_temp_files(req.files);
    return res.status(500).json({
      status: "error",
      message: "Internal server error.",
      error: err.message,
    });
  }
};

/* ================= COMPLETE CREATION ================= */
export const handle_property_complete_creation = async (req, res) => {
  try {
    const {
      basic_info,
      location,
      property_details,
      media_and_files,
      amenities,
      publishing,
      property_ownership,
      financial,
      legal_and_insurance,
      unit_structure,
      parking_management,
      utilities_assignment,
    } = req.body;

    const rawPayload = {
      basic_info: JSON.parse(basic_info || "{}"),
      location: JSON.parse(location || "{}"),
      property_details: JSON.parse(property_details || "{}"),
      media_and_files: JSON.parse(media_and_files || "{}"),
      amenities: JSON.parse(amenities || "[]"),
      publishing: JSON.parse(publishing || "{}"),
      property_ownership: JSON.parse(property_ownership || "{}"),
      financial: JSON.parse(financial || "{}"),
      legal_and_insurance: JSON.parse(legal_and_insurance || "{}"),
      unit_structure: JSON.parse(unit_structure || "[]"),
      parking_management: JSON.parse(parking_management || "{}"),
      utilities_assignment: JSON.parse(utilities_assignment || "[]"),
    };

    const cleanedPayload = sanitizePayload(rawPayload);

    const property = await property_model.create({
      is_draft: false,
      basic_info: cleanedPayload.basic_info || {},
      location: cleanedPayload.location || {},
      property_details: cleanedPayload.property_details || {},
      media_and_files: {
        property_photos: [],
        property_videos: [],
        floor_plans_and_layouts: [],
        legal_documents: [],
        insurance_papers: [],
        media_organization:
          cleanedPayload.media_and_files?.media_organization || {},
      },
      amenities: cleanedPayload.amenities || [],
      publishing: cleanedPayload.publishing || {},
      property_ownership: cleanedPayload.property_ownership || {},
      financial: cleanedPayload.financial || {},
      legal_and_insurance: cleanedPayload.legal_and_insurance || {},
      unit_structure: cleanedPayload.unit_structure || [],
      parking_management: cleanedPayload.parking_management || {
        enabled: false,
        spaces: [],
      },
      utilities_assignment: cleanedPayload.utilities_assignment || [],
    });

    const files = req.files || {};
    const id = property._id.toString();

    const topLevelFields = [
      "property_photos",
      "property_videos",
      "floor_plans_and_layouts",
      "legal_documents",
      "insurance_papers",
    ];

    for (const field of topLevelFields) {
      const uploaded = await upload_files_to_s3_batch(
        files[field] || [],
        "property",
        id,
        field,
      );
      property.media_and_files[field] = uploaded.map((u) => ({
        url: u.url,
        key: u.key,
      }));
    }

    const furnitureFiles = files.furniture_images || [];
    const floorImageFiles = files.floor_images || [];

    if (
      (furnitureFiles.length > 0 || floorImageFiles.length > 0) &&
      cleanedPayload.unit_structure?.length > 0
    ) {
      for (let i = 0; i < property.unit_structure.length; i++) {
        const floorData = cleanedPayload.unit_structure[i];
        const floorName = floorData.floor?.name || `floor_${i}`;

        const furnitureIndices = floorData.furniture_image_indices || [];
        if (furnitureFiles.length > 0 && furnitureIndices.length > 0) {
          const uploaded = await processFloorLevelImages(
            furnitureFiles,
            furnitureIndices,
            i,
            floorName,
            "furniture_images",
            id,
          );
          property.unit_structure[i].floor.furniture_images = uploaded.map(
            (u) => ({ url: u.url, key: u.key }),
          );
        }

        const floorImgIndices = floorData.floor_image_indices || [];
        if (floorImageFiles.length > 0 && floorImgIndices.length > 0) {
          const uploaded = await processFloorLevelImages(
            floorImageFiles,
            floorImgIndices,
            i,
            floorName,
            "floor_images",
            id,
          );
          property.unit_structure[i].floor.floor_images = uploaded.map((u) => ({
            url: u.url,
            key: u.key,
          }));
        }
      }

      await handleUnmappedFiles(
        furnitureFiles,
        cleanedPayload.unit_structure,
        id,
        "furniture_image_indices",
        "furniture_images",
      );
      await handleUnmappedFiles(
        floorImageFiles,
        cleanedPayload.unit_structure,
        id,
        "floor_image_indices",
        "floor_images",
      );
    }

    await property.save();
    clear_temp_files(req.files);

    return res.status(201).json({
      status: "success",
      message: "Complete property creation completed successfully.",
      data: property,
    });
  } catch (err) {
    clear_temp_files(req.files);
    return res.status(500).json({
      status: "error",
      message: "Internal server error.",
      error: err.message,
    });
  }
};

/* ================= EDIT PROPERTY COMPLETE ================= */
export const handle_edit_property_complete = async (req, res) => {
  try {
    const { property_id } = req.params;

    const property = await property_model.findById(property_id);
    if (!property) {
      clear_temp_files(req.files);
      return res
        .status(404)
        .json({ status: "error", message: "Property not found." });
    }

    const {
      basic_info,
      location,
      property_details,
      media_and_files,
      amenities,
      publishing,
      property_ownership,
      financial,
      legal_and_insurance,
      unit_structure,
      parking_management,
      utilities_assignment,
      existing_property_photos,
      existing_property_videos,
      existing_floor_plans_and_layouts,
      existing_legal_documents,
      existing_insurance_papers,
    } = req.body;

    const rawPayload = {
      basic_info: JSON.parse(basic_info || "{}"),
      location: JSON.parse(location || "{}"),
      property_details: JSON.parse(property_details || "{}"),
      media_and_files: JSON.parse(media_and_files || "{}"),
      amenities: JSON.parse(amenities || "[]"),
      publishing: JSON.parse(publishing || "{}"),
      property_ownership: JSON.parse(property_ownership || "{}"),
      financial: JSON.parse(financial || "{}"),
      legal_and_insurance: JSON.parse(legal_and_insurance || "{}"),
      unit_structure: JSON.parse(unit_structure || "[]"),
      parking_management: JSON.parse(parking_management || "{}"),
      utilities_assignment: JSON.parse(utilities_assignment || "[]"),
    };

    const cleanedPayload = sanitizePayload(rawPayload);
    const files = req.files || {};
    const id = property._id.toString();

    const topLevelFields = [
      { field: "property_photos", existing: existing_property_photos },
      { field: "property_videos", existing: existing_property_videos },
      {
        field: "floor_plans_and_layouts",
        existing: existing_floor_plans_and_layouts,
      },
      { field: "legal_documents", existing: existing_legal_documents },
      { field: "insurance_papers", existing: existing_insurance_papers },
    ];

    if (!cleanedPayload.media_and_files) cleanedPayload.media_and_files = {};

    for (const { field, existing } of topLevelFields) {
      const keptUrls = existing ? JSON.parse(existing) : [];
      const current = property.media_and_files[field] || [];
      const removed = current.filter(
        (item) => !keptUrls.includes(item.url ?? item),
      );
      await delete_s3_keys(removed.map((item) => item.key).filter(Boolean));
      const kept = current.filter((item) =>
        keptUrls.includes(item.url ?? item),
      );
      const newUploads = await upload_files_to_s3_batch(
        files[field] || [],
        "property",
        id,
        field,
      );
      cleanedPayload.media_and_files[field] = [
        ...kept,
        ...newUploads.map((u) => ({ url: u.url, key: u.key })),
      ];
    }

    const furnitureFiles = files.furniture_images || [];
    const floorImageFiles = files.floor_images || [];

    if (
      (furnitureFiles.length > 0 || floorImageFiles.length > 0) &&
      cleanedPayload.unit_structure?.length > 0
    ) {
      for (const floor of property.unit_structure || []) {
        await delete_s3_keys(
          (floor.floor?.furniture_images || [])
            .map((f) => f.key)
            .filter(Boolean),
        );
        await delete_s3_keys(
          (floor.floor?.floor_images || []).map((f) => f.key).filter(Boolean),
        );
      }

      const updatedUnitStructure = cleanedPayload.unit_structure.map((f) => ({
        ...f,
      }));

      for (let i = 0; i < updatedUnitStructure.length; i++) {
        const floorData = cleanedPayload.unit_structure[i];
        const floorName = floorData.floor?.name || `floor_${i}`;

        const furnitureIndices = floorData.furniture_image_indices || [];
        if (furnitureFiles.length > 0 && furnitureIndices.length > 0) {
          const uploaded = await processFloorLevelImages(
            furnitureFiles,
            furnitureIndices,
            i,
            floorName,
            "furniture_images",
            id,
          );
          updatedUnitStructure[i].floor = {
            ...updatedUnitStructure[i].floor,
            furniture_images: uploaded.map((u) => ({ url: u.url, key: u.key })),
          };
        }

        const floorImgIndices = floorData.floor_image_indices || [];
        if (floorImageFiles.length > 0 && floorImgIndices.length > 0) {
          const uploaded = await processFloorLevelImages(
            floorImageFiles,
            floorImgIndices,
            i,
            floorName,
            "floor_images",
            id,
          );
          updatedUnitStructure[i].floor = {
            ...updatedUnitStructure[i].floor,
            floor_images: uploaded.map((u) => ({ url: u.url, key: u.key })),
          };
        }
      }

      cleanedPayload.unit_structure = updatedUnitStructure;
    }

    const updated_property = await property_model.findByIdAndUpdate(
      property_id,
      { $set: cleanedPayload },
      { new: true },
    );

    clear_temp_files(req.files);

    return res.status(200).json({
      status: "success",
      message: "Property updated successfully.",
      data: updated_property,
    });
  } catch (err) {
    clear_temp_files(req.files);
    return res.status(500).json({
      status: "error",
      message: "Internal server error.",
      error: err.message,
    });
  }
};

/* ================= DELETE PROPERTY ================= */
export const handle_delete_property = async (req, res) => {
  try {
    const { property_id } = req.params;

    const property = await property_model.findById(property_id);
    if (!property) {
      return res
        .status(404)
        .json({ status: "error", message: "Property not found." });
    }

    const mediaFields = [
      "property_photos",
      "property_videos",
      "floor_plans_and_layouts",
      "legal_documents",
      "insurance_papers",
    ];

    for (const field of mediaFields) {
      await delete_s3_keys(
        (property.media_and_files[field] || [])
          .map((item) => item.key)
          .filter(Boolean),
      );
    }

    for (const floor of property.unit_structure || []) {
      await delete_s3_keys(
        (floor.floor?.furniture_images || []).map((f) => f.key).filter(Boolean),
      );
      await delete_s3_keys(
        (floor.floor?.floor_images || []).map((f) => f.key).filter(Boolean),
      );
    }

    await property_model.findByIdAndDelete(property_id);

    return res.status(200).json({
      status: "success",
      message: "Property deleted successfully.",
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error.",
      error: err.message,
    });
  }
};
