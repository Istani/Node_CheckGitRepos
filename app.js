process.chdir(__dirname);
const package_info = require("./package.json");
var software = package_info.name + " (V " + package_info.version + ")";
console.log(software);
console.log("=".repeat(software.length));

const fs = require("fs");
const child_process = require("child_process");
var spawn = require('child_process').spawnSync;
var exec = require('child_process').execSync;

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

  request(url, { headers: { "User-Agent": software, authorization: "token " + process.env.Github_Token } }, async function (error, response, body) {
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
	      await spawn('git', ['clone', '--recursive', element.clone_url], { stdio: 'inherit' });
        await use_commands(element.name, element.clone_url);
      }
    }
    await fork_all();
    await list_dir();
    setTimeout(() => {
      process.exit(0);
    }, 1000 * 60 * 60 * 24);
  });
}
get_repos();

async function fork_all() {
  const url = "https://api.github.com/user/orgs";
  console.log(url);
  request(url, { headers: { "User-Agent": software, authorization: "token " + process.env.Github_Token } }, async function (error, response, body) {
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
async function ForkAll(url, company_name = "") {
  console.log(url);
  request(url, { headers: { "User-Agent": software, authorization: "token " + process.env.Github_Token } }, async function (error, response, body) {
    if (error) {
      console.error("error:", error);
    } else {
      var data = JSON.parse(body);
      process.chdir(__dirname);
      await save_file(company_name + "_repos", data);
      for (let data_index = 0; data_index < data.length; data_index++) {
        const element = data[data_index];
        await ForkUrl(element.forks_url);
      }
    }
  });
}
async function ForkUrl(url) {
  console.log(url);
  request(url, { headers: { "User-Agent": software, authorization: "token " + process.env.Github_Token } }, async function (error, response, body) {
    if (error) {
      console.error("error:", error);
    } else {
      var data = JSON.parse(body);
      console.log(url);
    }
  });
}

async function list_dir() {
  process.chdir(__dirname);
  process.chdir("../");
  var path = process.cwd()+"/";
  var files = fs.readdirSync(path);
  for(var i in files) {
    if (fs.lstatSync(path + files[i]).isDirectory()==true) {
      console.log("Next DIR: " + (path + files[i]));
      await use_commands(path + files[i] + "/");
    }
  }
  process.chdir(__dirname);
  console.log("List DIR done");
}
//list_dir();

async function use_commands(path, url) {
  console.log(path);
  process.chdir(path);
  try {
    console.log(process.cwd());
    await spawn('git', ['remote', 'set-url', 'origin', url], { stdio: 'inherit' });

    await spawn('git', ['checkout', 'master'], { stdio: 'inherit' });
    await spawn('git', ['pull', '--all'], { stdio: 'inherit' });
    //await exec("git pull bitbucket master", function(error, stdout, stderr) {
    //  console.log(stdout);
    //});
    await spawn('git', ['add', '.'], { stdio: 'inherit' });
    await spawn('git', ['commit', '-m', "'Backup Sync'"], { stdio: 'inherit' });
    // git remote | xargs -L1 git push --all
    await exec("git remote | xargs -L1 git push --all", function(error, stdout, stderr) {
      console.log(stdout);
    });
  } catch (e) {
    console.error(e);
  }
  process.chdir("../");
}
