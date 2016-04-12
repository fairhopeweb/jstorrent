// https://bugs.chromium.org/p/chromium/issues/detail?id=242373
// 1) there is no way to pass FileEntry to worker
// 2) worker has no chrome.* permissions
// 3) entry.createWriterSync can never be called on user directory
