const moment = require("moment");
const xray = require("./xray");

/**
 * Combines all suite names and the the test name to one identifier
 * @param {object[]} test
 * @return {string}
 */
const getTestName = (test) => {
  test.shift();
  return test.join(" - ");
};

/**
 * Extracts the name and the version of a browser
 * @param {object} browser
 * @param {string} browser.browserName name of the browser
 * @param {string} browser.version The browser version
 * @return {string}
 */
const getTestEnvironment = (browser) => {
  return `${browser.browserName}${browser.version}`;
};

/**
 * Returns the XRAY state for a WCT test state
 * @param {string} state
 * @return {string}
 */
const getXrayStateFromWctState = (state) => {
  switch (state) {
    case "passing":
      return "PASS";
    case "failing":
      return "FAIL";
  }
  console.log(`could not parse state ${state}`);
};

/**
 * Extracts the message of a wct error object
 * @param {object} error
 * @return {string}
 */
const extractErrorMessage = (error) => {
  if (error && error.message) {
    return error.message;
  }
};

/**
 * Formats a moment date to a string, XRAY is capable of importing
 * @param {moment.Moment} date
 * @return {string}
 */
const formatMomentToXrayCompatibleDate = (date) => {
  return date
    .toISOString(true)
    .replace(/(\.\d{3})/, "");
};

/**
 * Filters tests by JIRA Issue Key
 * @param {object[]} tests
 * @return {object[]}
 */
const filterTestsByJiraIssueKey = (tests) => {
  const regex = new RegExp(/@([a-z]+-\d+)$/, "i");
  return tests.filter((test) => {
    if (regex.test(test.name)) {
      const groups = regex.exec(test.name);
      test.name = groups[1];

      return true;
    }

    return false;
  });
};

/**
 * Creates a JSON file to push to the xray import API
 * @param {object[]} tests
 * @param {string} tests[].name
 * @param {string} tests[].status
 * @param {string} tests[].start
 * @param {string} tests[].end
 * @param {any} tests[].error
 * @param {string} start
 * @param {string} finish
 * @param {string} environment
 * @param {object[]} customFields
 * @param {string} customFields.key
 * @param {string} customFields.value
 * @return {string}
 */
const createXrayJson = (tests, start, finish, environment, customFields) => {
  let info = {
    summary: "Test execution for Web Component Tests",
    description: "Automatically generated from Web Component Test results",
    revision: "1.0.0",
    startDate: start,
    finishDate: finish
  };
  if (customFields) {
    customFields.forEach((field) => {
      info[field.key] = field.value;
    });
  }

  return JSON.stringify({
    info: info,
    tests: tests.map((test) => {
      return {
        testKey: test.name,
        start: test.start,
        finish: test.end,
        comment: test.error,
        status: test.status
      };
    })
  }, null, 2);
};

const checkAndExpandOptions = (pluginOptions) => {
  let options = {
    port: 80
  };

  if (!pluginOptions || !pluginOptions.jiraHost) {
    console.error("No host specified, unable to report result to XRAY");

    return false;
  }
  options.host = pluginOptions.jiraHost;

  if (pluginOptions.jiraPort) {
    options.port = pluginOptions.jiraPort;
  }

  if (!pluginOptions.jiraAuthorization) {
    console.error("No authorization specified, unable to report result to XRAY");

    return false;
  }
  options.authorization = pluginOptions.jiraAuthorization;

  if (pluginOptions.customField) {
    options.customFields = parseCustomFields(pluginOptions.customField);
  }

  return options;
};

/**
 * Tries to extract the keys and values from the command line
 * @param {string[]} customFields
 */
const parseCustomFields = (customFields) => {
  let result = [];

  customFields
    .forEach((keyValuePair) => {
      if (keyValuePair) {
        const elements = keyValuePair.split(":");
        result.push({
          key: elements[0],
          value: elements[1] || ""
        });
      }
    });

  return result;
};

/**
 * The main function of the plugin
 * @param {any} wct The wct object
 * @param {object} pluginOptions Configuration options for the plugin
 * @param {object} pluginOptions.jiraHost The host name of JIRA instance to import results to
 * @param {object} pluginOptions.jiraPort The port of the JIRA instance
 * @param {object} pluginOptions.jira.Authorization The content of the authorization header
 * @param {object} pluginOptions.testExecutionVersion The version to write into the Test Execution
 */
const plugin = (wct, pluginOptions) => {
  let options;
  wct.hook("configure", (done) => {
    options = checkAndExpandOptions(pluginOptions);

    done();
  });

  /**
   * @type {{}[]}
   */
  const tests = [];
  let start;
  let finish;
  let testStart;
  let testEnd;
  /**
   * @type {string}
   */
  let environment;

  wct.on("run-start", () => {
    start = moment();
  });

  wct.on("test-start", () => {
    testStart = moment();
  });

  wct.on("test-end", (browser, test) => {
    testEnd = moment();
    const name = getTestName(test.test);
    const state = getXrayStateFromWctState(test.state);
    environment = getTestEnvironment(browser);

    tests.push({
      name: name,
      status: state,
      start: formatMomentToXrayCompatibleDate(testStart),
      end: formatMomentToXrayCompatibleDate(testEnd),
      error: extractErrorMessage(test.error)
    });
  });

  wct.on("run-end", () => {
    finish = moment();
  });

  wct.hook("cleanup", (done) => {
    if (!options) {
      console.log("returning because options is", options);
      done();

      return;
    }

    start = formatMomentToXrayCompatibleDate(start);
    finish = formatMomentToXrayCompatibleDate(finish);

    const testsWithIssue = filterTestsByJiraIssueKey(tests);
    const json = createXrayJson(testsWithIssue, start, finish, environment, options.customFields);

    xray(options.host, options.port, options.authorization, json)
      .then((result) => {
        console.log(`created new Test Ececution ${result.testExecIssue.key}`);
        done();
      })
      .catch((error) => {
        console.error("error reporting test results to Jira XRAY:", error);
        done();
      });
  });
};

module.exports = plugin;
