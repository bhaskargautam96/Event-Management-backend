import ejs from "ejs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const templateRootPath = path.resolve(__dirname, "../../templates");

export async function renderEmailTemplate(templateName, data = {}) {
  const templatePath = path.join(templateRootPath, templateName);
  return ejs.renderFile(templatePath, data);
}