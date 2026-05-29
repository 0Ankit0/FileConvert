const EXT_TO_MIME = {
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    odt: "application/vnd.oasis.opendocument.text",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    txt: "text/plain",
    csv: "text/csv",
    html: "text/html",
    htm: "text/html",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    tiff: "image/tiff",
    mp4: "video/mp4",
    mov: "video/quicktime",
    webm: "video/webm",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    zip: "application/zip",
    tar: "application/x-tar",
    rar: "application/x-rar-compressed",
    json: "application/json",
};
export function extensionToMime(extension) {
    return EXT_TO_MIME[extension.toLowerCase()] || "application/octet-stream";
}
export function mimeFromFile(file) {
    if (file.type) {
        return file.type;
    }
    const extension = file.name.split(".").pop()?.toLowerCase() || "";
    return extensionToMime(extension);
}
