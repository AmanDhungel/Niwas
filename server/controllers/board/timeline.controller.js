import board_model from "../../models/board/board.model.js";
import timeline_model from "../../models/board/timeline.model.js";
import {
  upload_file_to_s3,
  build_s3_key,
  clear_temp_files,
} from "../../utils/s3.util.js";

export const handle_create_timeline = async (req, res) => {
  try {
    /* ================= AUTH ================= */
    // const { user_token } = req.cookies;
    // const { user_id } = jwt.verify(user_token, process.env.JWT_SECRET);

    // const user = await user_model.findOne({
    //   _id: user_id,
    //   user_type: "admin",
    // });

    // if (!user) {
    //   clear_temp_files(req.files);
    //   return res.status(401).json({
    //     status: "error",
    //     message: "Unauthorized",
    //   });
    // }

    /* ================= BODY ================= */
    const { board, task_list, task, status, date, members, description } =
      req.body;

    /* ================= VERIFY BOARD FIRST ================= */
    const boardDoc = await board_model.findById(board);
    if (!boardDoc) {
      clear_temp_files(req.files);
      return res.status(404).json({
        status: "error",
        message: "Board not found.",
      });
    }

    /* ================= CREATE TIMELINE EVENT ================= */
    const timelineEvent = await timeline_model.create({
      board,
      task_list,
      task,
      status: status || "scheduled",
      date,
      members: typeof members === "string" ? JSON.parse(members) : (members || []),
      description: description || "",
      attachments: [],
    });

    /* ================= FILE UPLOAD TO S3 ================= */
    const attachmentFiles = req.files || [];

    if (attachmentFiles.length > 0) {
      const folder = `workspace/${boardDoc.workspace}/vendor/${boardDoc.vendor}/board/${boardDoc._id}/timeline/${timelineEvent._id}`;

      const attachments = [];

      for (const file of attachmentFiles) {
        const key = build_s3_key(folder, "", "", file.filename);
        const uploaded = await upload_file_to_s3(file, key);
        attachments.push({ url: uploaded.url, key: uploaded.key });
      }

      timelineEvent.attachments = attachments;
      await timelineEvent.save();
    }

    clear_temp_files(req.files);

    /* ================= RESPONSE ================= */
    return res.status(201).json({
      status: "success",
      message: "Timeline event created successfully.",
      data: timelineEvent,
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

export const handle_get_board_timelines = async (req, res) => {
  try {
    /* ================= PARAMS ================= */
    const { board_id, task_list_id, task_id } = req.params;

    /* ================= FETCH TIMELINES ================= */
    const timelines = await timeline_model.find({
      board: board_id,
      task_list: task_list_id,
      task: task_id,
    });

    /* ================= RESPONSE ================= */
    return res.status(200).json({
      status: "success",
      message: "Timelines fetched successfully.",
      data: timelines,
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error.",
      error: err.message,
    });
  }
};