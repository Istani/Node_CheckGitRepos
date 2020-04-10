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
  await fork_all();
  const url = "https://api.github.com/users/" + process.env.Github_User + "/repos";
  console.log(url);

  request(url, { headers: { "User-Agent": software, authorization: "token "+process.env.Github_Token  } }, async function (error, response, body) {
    if (error) {
      console.error("error:", error);
    } else {
      var data = JSON.parse(body);
      process.chdir(__dirname);
      await save_file(process.env.Github_User + "_repos", data);
      process.chdir("../");
      for (let data_index = 0; data_index < data.length; data_index++) {
        const element = data[data_index];
        console.log(element.name);
        await child_process.spawnSync("git", ["clone","--recursive", element.clone_url]);
        process.chdir(element.name);
        await child_process.spawnSync("git", ["checkout", "master"]);
        await child_process.spawnSync("git", ["pull", "--all"]);
        await child_process.spawnSync("git", ["add", "."]);
        await child_process.spawnSync("git", ["commit", "-m", "'Backup Sync'"]);
        await child_process.spawnSync("git", ["push", "--all"]);
        //await child_process.spawnSync("git", ["submodule", "init"]);
        //await child_process.spawnSync("git", ["submodule", "update"]);
        process.chdir("../");
      }
    }
    setTimeout(() => {
	process.exit(0);
    }, 1000 * 60 * 60 * 24);
  });
}
get_repos();

async function fork_all() {
  const url = "https://api.github.com/user/orgs";
  console.log(url);
  request(url, { headers: { "User-Agent": software , authorization: "token "+process.env.Github_Token } }, async function (error, response, body) {
    if (error) {
      console.error("error:", error);
    } else {
      var data = JSON.parse(body);
      process.chdir(__dirname);
      await save_file(process.env.Github_User + "_orgs", data);
      for (let data_index = 0; data_index < data.length; data_index++) {
        const element = data[data_index];
        await ForkAll(element.repos_url, element.login);
      }
    }
  });
}
async function ForkAll(url, company_name="") {
 request(url, { headers: { "User-Agent": software , authorization: "token "+process.env.Github_Token } }, async function (error, response, body) {
    if (error) {
      console.error("error:", error);
    } else {
      var data = JSON.parse(body);
      await save_file(company_name + "_repos", data);
      for (let data_index = 0; data_index < data.length; data_index++) {
        const element = data[data_index];
        await ForkUrl(element.forks_url);
      }
    }
  });
}
async function ForkUrl(url) {
  request(url, { headers: { "User-Agent": software , authorization: "token "+process.env.Github_Token } }, async function (error, response, body) {
    if (error) {
      console.error("error:", error);
    } else {
      var data = JSON.parse(body);
      console.log(url);
    }
  });
}