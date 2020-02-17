process.chdir(__dirname);
const package_info = require("./package.json");
var software = package_info.name + " (V " + package_info.version + ")";
console.log(software);
console.log("=".repeat(software.length));

const fs = require("fs");
const child_process = require("child_process");

var envpath = __dirname + "/.env";
var config = require("dotenv").config({ path: envpath });
var config_example = "";
if (fs.existsSync(".env")) {
  for (var attributename in config.parsed) {
    config_example += attributename + "=\r\n";
  }
  fs.writeFileSync(".env.example", config_example);
}

const request = require("request");

async function save_file(name, data) {
  try {
    var filename = "./tmp/" + name + ".json";
    var fs = require("fs");
    if (fs.existsSync(filename)) {
      await fs.unlinkSync(filename);
    }
    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(e);
  }
}

async function get_repos() {
  const url = "https://api.github.com/users/" + process.env.Github_User + "/repos";
  console.log(url);
  request(url, { headers: { "User-Agent": software } }, async function(error, response, body) {
    if (error) {
      console.error("error:", error);
    } else {
      var data = JSON.parse(body);
      await save_file(process.env.Github_User + "_repos", data);
      process.chdir("../");
      for (let data_index = 0; data_index < data.length; data_index++) {
        const element = data[data_index];
        child_process.spawn("git", ["clone", element.clone_url]);
      }
    }
    setTimeout(get_repos, 1000 * 10);
  });
}
get_repos();
