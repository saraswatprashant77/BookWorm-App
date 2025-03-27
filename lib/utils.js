// convert function createdat to "march 2025 format"

export function formatMemberSince(dateString) {
    const date = new Date(dateString);
    const month = date.toLocaleString("default",{month:"short"});
    const year = date.getFullYear();
    return `${month} ${year}`;
}

// convert to "march 27, 2025"

export function formatPublishDate(dateString){
    const date = new Date(dateString);
    const month = date.toLocaleString("default",{month:"long"});
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
}