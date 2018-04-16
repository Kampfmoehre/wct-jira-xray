const https = require("https");

/**
 * Sends a post request to import Test results to Jira XRAY
 * @param {string} host The host to post the result to
 * @param {string} port The port
 * @param {string} authorization The content of the authorization header
 * @param {string} json The json data to post
 * @return {Promise<object>}
 */
const importTestResultToXray = (host, port, authorization, json) => {
  /**
   * @type {http.ReqestOptions}
   */
  const options = {
    headers: {
      "Authorization": authorization,
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(json),
      "User-Agent": "WCT-Jira-Xray-Plugin"
    },
    method: "POST",
    host: host,
    port: port,
    path: "/rest/raven/1.0/import/execution"
  };

  return new Promise((resolve, reject) => {
    const callback = (response) => {
      let result = "";
      response.on("data", (chunk) => {
        result += chunk;
      });
      response.on("end", () => {
        if (response.statusCode !== 200) {
          reject(result || response.statusMessage);

          return;
        }

        if (response.headers["content-type"].includes("application/json")) {
          result = JSON.parse(result);
        }
        resolve(result);
      });
    };

    // TODOfind a less security critical way to handle self signed certificates
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    const request = https.request(options, callback);

    request.on("error", (e) => {
      reject(e);
    });

    request.write(json);
    request.end();
  });
};

module.exports = importTestResultToXray;
