const fs = require('fs');
const path = require('path');

// Ensure upload directory exists
exports.ensureUploadDir = () => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
    return uploadDir;
};
