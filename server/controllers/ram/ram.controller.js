import fs from "fs";
import path from "path";
import ram_model from "../../models/ram/ram.model.js";
import board_model from "../../models/board/board.model.js";

/* ================= CREATE RAM ================= */
export const handle_create_ram = async (req, res) => {
  try {
    /* ================= AUTH ================= */
    // const { user_token } = req.cookies;
    // const { user_id } = jwt.verify(user_token, process.env.JWT_SECRET);

    // const user = await user_model.findOne({
    //   _id: user_id,
    //   user_type: "admin",
    // });

    // if (!user) {
    //   return res.status(401).json({
    //     status: "error",
    //     message: "Unauthorized",
    //   });
    // }

    /* ================= BODY ================= */
    const {
      type,
      // domain_workspace,
      // vendor_workspace,
      // board,
      title,
      description,
      priority,
      property,
      location,
      date,
      time,
      estimated_duration,
      total_estimated_cost,
      cost_breakdown,
      tags,
      internal_notes,
      notify_affected_tenants,
      require_approval_before_starting_work,
      pipeline,
    } = req.body;

    if (!type || !title) {
      return res.status(400).json({
        status: "error",
        message: "Required fields missing.",
      });
    }

    const parsedPipeline = pipeline ? JSON.parse(pipeline) : {};
    const { domain_workspace, vendor_workspace, board, tasklist } =
      parsedPipeline;

    /* ================= FINAL DIRECTORY ================= */
    const finalDir = path.join(
      "uploads",
      "workspace",
      domain_workspace,
      "vendor",
      vendor_workspace,
      "board",
      board || "unassigned",
      "ram",
      "files",
    );

    fs.mkdirSync(finalDir, { recursive: true });

    /* ================= MOVE FILES ================= */
    const attachmentPaths = [];

    if (req.files?.length) {
      for (const file of req.files) {
        const finalPath = path.join(finalDir, file.filename);
        fs.renameSync(file.path, finalPath);

        attachmentPaths.push(finalPath.replace(/^uploads\//, ""));
      }
    }

    /* ================= CREATE RAM ================= */
    const parsedCostBreakdown = cost_breakdown
      ? JSON.parse(cost_breakdown)
      : {};

    const parsedTags = tags ? JSON.parse(tags) : [];

    const ram = await ram_model.create({
      type,
      domain_workspace,
      vendor_workspace,
      board,
      title,
      description,
      priority,
      property,
      location,
      date,
      time,
      estimated_duration,
      total_estimated_cost,
      cost_breakdown: parsedCostBreakdown,
      tags: parsedTags,
      internal_notes,
      notify_affected_tenants,
      require_approval_before_starting_work,
      attachments: attachmentPaths,
    });

    /* ================= PUSH TO KANBAN BOARD ================= */
    if (board) {
      const boardDoc = await board_model.findById(board);

      if (boardDoc) {
        /* ========== ENSURE TASK LIST EXISTS ========== */
        if (!boardDoc.task_lists.length) {
          boardDoc.task_lists.push({
            title: "RAM",
            tasks: [],
          });
        }

        // const taskList = boardDoc.task_lists[0];
        const taskList = tasklist
          ? boardDoc.task_lists.find((tl) => tl._id.toString() === tasklist)
          : boardDoc.task_lists[0];

        /* ========== BUILD TASK DESCRIPTION ========== */
        const descriptionLines = [
          "--- RAM DETAILS ---",
          "",
          `Type: ${type}`,
          `Priority: ${priority || "N/A"}`,
          `Property: ${property || "N/A"}`,
          `Location: ${location || "N/A"}`,
          `Date: ${date || "N/A"}`,
          `Time: ${time || "N/A"}`,
          `Estimated Duration: ${estimated_duration || "N/A"}`,
          `Total Estimated Cost: ${total_estimated_cost || 0}`,
          "",
          "Cost Breakdown:",
          `- Labor: ${parsedCostBreakdown.labor || 0}`,
          `- Materials: ${parsedCostBreakdown.materials || 0}`,
          `- Additional Charges: ${parsedCostBreakdown.additional_charges || 0}`,
          "",
          `Tags: ${parsedTags.length ? parsedTags.join(", ") : "N/A"}`,
          "",
          "Internal Notes:",
          internal_notes || "N/A",
          "",
          `Notify Affected Tenants: ${notify_affected_tenants ? "Yes" : "No"}`,
          `Approval Required: ${
            require_approval_before_starting_work ? "Yes" : "No"
          }`,
        ];

        const finalDescription = descriptionLines.join("\n");

        /* ========== ENSURE TASK EXISTS ========== */
        // if (!taskList.tasks.length) {
        //   taskList.tasks.push({
        //     title: title,
        //     description: finalDescription,
        //     priority,
        //     deadline: date,
        //     attachments: attachmentPaths.map((file) => ({
        //       filename: file,
        //     })),
        //     origin: "ram",
        //     ram: ram._id,
        //   });
        // } else {
        //   /* ========== APPEND SAFELY (NON-DESTRUCTIVE) ========== */
        //   const task = taskList.tasks[0];

        //   task.description = task.description
        //     ? `${task.description}\n\n${finalDescription}`
        //     : finalDescription;

        //   task.attachments.push(
        //     ...attachmentPaths.map((file) => ({
        //       filename: file,
        //     })),
        //   );
        // }

        taskList.tasks.push({
          title: title,
          description: finalDescription,
          category: "ram",
          priority,
          deadline: date,
          attachments: attachmentPaths.map((file) => ({
            filename: file,
          })),
          origin: "ram",
          ram: ram._id,
        });

        await boardDoc.save();
      }
    }

    /* ================= RESPONSE ================= */
    return res.status(201).json({
      status: "success",
      message: "RAM created successfully.",
      data: ram,
    });
  } catch (err) {
    /* ================= CLEANUP ON FAILURE ================= */
    if (req.files?.length) {
      req.files.forEach((file) => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }

    return res.status(500).json({
      status: "error",
      message: "Internal server error.",
      error: err.message,
    });
  }
};

export const handle_get_rams = async (req, res) => {
  try {
    const rams = await ram_model.find().populate({
      path: "pipeline.domain_workspace",
      model: "domain_workspace",
    });

    return res.status(200).json({
      status: "success",
      data: rams,
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error.",
      error: err.message,
    });
  }
};

export const handle_get_ram = async (req, res) => {
  try {
    const { ram_id } = req.params;

    const ram = await ram_model.findById(ram_id).populate({
      path: "pipeline.domain_workspace",
      model: "domain_workspace",
    });

    if (!ram) {
      return res.status(404).json({
        status: "error",
        message: "RAM not found.",
      });
    }

    return res.status(200).json({
      status: "success",
      data: ram,
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error.",
      error: err.message,
    });
  }
};
