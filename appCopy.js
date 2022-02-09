const puppeteer = require('puppeteer');
var fs = require('fs');
const json2csv = require('json2csv').parse;
const path = require('path')
const csv = require('csv-parser');
const fetch = require('node-fetch');

async function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        fetch(url)
            .then(res => res.text())
            .then(text => resolve(text));
    })
}

main = async () => {
    const browser = await puppeteer.launch({
        // executablePath: "/bin/brave-browser",
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized']
    });
    const page = await browser.newPage();
    await page.setDefaultTimeout(0)
    await page.setDefaultNavigationTimeout(0)


    // await page.goto("https://repo.maven.apache.org/maven2/");

    await getlinks(page, "https://repo.maven.apache.org/maven2/");



    browser.close();
}

main();

const findInteger = (arr = []) => {
   const isInteger = num => {
      return typeof num === 'number';
   };
   const el = arr.find(isInteger);
   return !!el;
};


const getlinks = async (page, url) => {
    try {
        let words = url.split('/')
        let dir_name = words[words.length-2]
        words = dir_name.split('.')
        let flag = false
        if ( words.length > 1 && findInteger(words)){
            console.log(words)
            flag = true
        }
        // console.log(dir_name);
        if (url.includes(".jar") || url.includes(".pom") || url.includes(".xml") || url.includes(".plugin") ||  url.includes(".apklib")
            || url.includes(".cfg")  || url.includes(".arr") || flag == true)
            {
                // console.log(dir_name);
                return
            }
        else { console.log(url)
            await page.goto(url); }
    } catch (error) {
        console.log(error);
    }
    // await page.goto(url);
    let links = await page.$$eval('a', els => {
        let currenturl = window.location.href;
        return els.map(el => {
            return currenturl + el.getAttribute('href');
        })
    })
    if (links.length > 0) {
        for (let i = 1; i < links.length; i++) {
            let rows = ['urls'];
            const link = links[i];
            let row = [{
                'urls': link
            }]
            // console.log(link);
            let extension = link.split('.')
            if (extension[extension.length - 1] == "module" || extension[extension.length - 1] == "klib" || extension[extension.length - 1] == "war" || extension[extension.length - 1] == "ear" || extension[extension.length - 1] == "rar" || extension[extension.length - 1] == "tar" || extension[extension.length - 1] == "zip" || extension[extension.length - 1] == "gz" || extension[extension.length - 1] == "distribution-zip" || extension[extension.length - 1] == "distribution-tgz" || extension[extension.length - 1] == "aar" || extension[extension.length - 1] == "sha512" || extension[extension.length - 1] == "sha256" ||
            extension[extension.length - 1] == "pom" || extension[extension.length - 1] == "xml" || extension[extension.length - 1] == "asc" || extension[extension.length - 1] == "plugin") {
                // console.log("if : " + link);
                continue;
            }
            else {
                extension = extension[extension.length - 1]
                if (extension == "jar") {
                    let version = link.match(/\d{0,9}\.\d{0,9}\.\d{0,9}/g)
                    version = version ? version[0] : null;
                    let arr = version ? version.split('.') : [];
                    if (!arr[2]) {
                        version = arr[0] ? `${arr[0]}.${arr[1]}` : null
                    }
                    if (link.includes(version)) {
                        arr = link.split('/')
                        let versionIndex = arr.indexOf(version)
                        let packageName = arr[versionIndex - 1]
                        let fileName = arr[versionIndex + 1]
                        if (fileName == `${packageName}-${version}.jar`) {
                            let sha1 = await fetchUrl(link + ".sha1")
                            let md5 = await fetchUrl(link + ".md5")
                            let json = {
                                "package name": packageName,
                                "version": version,
                                "file name": fileName,
                                "file url": link,
                                "md5": md5,
                                "sha1": sha1
                            }
                            console.log(json);
                            let usersjson = fs.readFileSync("data.json","utf-8");
                            let users = JSON.parse(usersjson)
                            users.push(json);
                            usersjson = JSON.stringify(users);
                            fs.writeFileSync("data4.json",usersjson,"utf-8");
                        }
                    }
                }
                else if (extension == "md5" || extension == "sha1"){
                    // console.log(link);
                }
                else {
                    await getlinks(page, link);
                }
            }
        }
    }
    else {
        // console.log(url);
    }
}
