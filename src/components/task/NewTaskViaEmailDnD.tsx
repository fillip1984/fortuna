"use client";

import { useContext, useEffect, useState } from "react";
import MsgReader from "@kenjiuno/msgreader";
import { addHours, format, parse } from "date-fns";
import { MdOutlineCloudUpload } from "react-icons/md";

import { AppContext } from "~/context/AppContextProvider";
import { api } from "~/trpc/react";

export default function NewTaskViaEmailDnD() {
  const { activeCollection, collections } = useContext(AppContext);
  const utils = api.useUtils();
  const { mutateAsync: createTask } = api.task.create.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.task.findAll.invalidate(),
        utils.collection.findAll.invalidate(),
      ]);
    },
  });

  const [dragActive, setDragActive] = useState(false);
  // register drag enter and leave to enable the backdrop and dropzone
  useEffect(() => {
    const handleDocumentDragEnter = (e: DragEvent) => {
      console.log("handling drag enter", { e });
      if (!e.dataTransfer?.types.includes("move")) {
        console.log("not files");
        return;
      }
      const items = e.dataTransfer.items;
      if (items && items.length > 0) {
        const item = items[0];
        if (item?.type !== "application/vnd.ms-outlook") {
          console.log("not outlook msg file");
          return;
        }
      }
      e.preventDefault();
      setDragActive(true);
    };

    const handleDocumentDragLeave = (e: DragEvent) => {
      console.log("handling drag leave", { e });
      e.preventDefault();
      if (e.clientX === 0 && e.clientY === 0) {
        setDragActive(false);
      }
    };

    document.addEventListener("dragenter", handleDocumentDragEnter);
    document.addEventListener("dragleave", handleDocumentDragLeave);

    return () => {
      document.removeEventListener("dragenter", handleDocumentDragEnter);
      document.removeEventListener("dragleave", handleDocumentDragLeave);
    };
  }, []);

  const handleDrop = async (e: React.DragEvent<HTMLInputElement>) => {
    console.log("handling drop", { e });
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      await processMsgFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("handling change", { e });
    e.preventDefault();
    if (e.target.files?.[0]) {
      await processMsgFile(e.target.files[0]);
    }
  };

  const processMsgFile = async (msgFile: File) => {
    const msgFileBuffer = await msgFile.arrayBuffer();
    const msgReader = new MsgReader(msgFileBuffer);
    const msgInfo = msgReader.getFileData();
    const { subject, body, messageDeliveryTime } = msgInfo;
    const received = parse(
      messageDeliveryTime ?? "",
      "EEE, dd MMM yyyy HH:mm:ss 'GMT'",
      new Date(),
    );
    // To get the offset in hours: (-4 or --5 depending on daylight savings time)
    const now = new Date();
    const timezoneOffsetMinutes = now.getTimezoneOffset();
    const timezoneOffsetHours = timezoneOffsetMinutes / 60;
    const adjustedReceived = addHours(received, -timezoneOffsetHours);

    await createTask({
      title: subject ?? "No subject",
      description: body ?? "",
      dueDate: activeCollection?.id === "Today" ? new Date() : null,
      priority:
        activeCollection?.id === "Urgent"
          ? "Urgent"
          : activeCollection?.id === "Unscheduled"
            ? "Important"
            : null,
      source: `Email received on ${format(adjustedReceived, "yyyy/MM/dd hh:mm a")} with subject: ${subject}`,
      collectionId:
        collections?.find((c) => c.id === activeCollection?.id)?.id ?? null,
    });
  };

  return (
    <>
      {dragActive && (
        <div
          className={`${dragActive ? "bg-black/40 opacity-75" : "opacity-0"} absolute inset-0 mb-3 flex h-screen w-screen items-center justify-center px-2 transition ease-in-out`}
        >
          <div className="flex flex-col items-center justify-center py-1">
            <span className="text-3xl font-semibold">Add Email as task</span>
            <MdOutlineCloudUpload className="h-24 w-24" />
          </div>
          {/* Trick to getting file drag and drop to function (by function I 
              mean the browser doesn't try to load or ask if you want to 
              download it) is to drop the file into the <input type="file"/> 
              element. To style things, you cannot make the input hidden but 
              can make it's opacity 0. One last note, the input below overlays 
              everything above so css styles like setting the cursor to a 
              pointer will not apply unless you put it on this element. Same 
              with on hover effects... messing with z index doesn't fix this.
            */}

          <input
            id="dropzone-file"
            type="file"
            accept=".msg"
            multiple={false}
            className="bg-destructive absolute inset-0 h-screen w-screen opacity-0"
            onChange={handleChange}
            onDrop={handleDrop}
          />
        </div>
      )}
    </>
  );
}
