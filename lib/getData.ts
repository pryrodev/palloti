import fs from "fs";
import path from "path";

function readData<T>(filename: string): T {
  const filePath = path.join(process.cwd(), "data", filename);
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
}

function writeData(filename: string, data: unknown): void {
  const filePath = path.join(process.cwd(), "data", filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

function writeDictionary(lang: "en" | "fr", data: unknown): void {
  const filePath = path.join(process.cwd(), "dictionaries", `${lang}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

function readDictionary(lang: "en" | "fr") {
  const filePath = path.join(process.cwd(), "dictionaries", `${lang}.json`);
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

export { readData, writeData, writeDictionary, readDictionary };
