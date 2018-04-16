const rewire = require("rewire");
const moment = require("moment");
const { expect } = require("chai");
const plugin = rewire("../src/plugin");

suite("plugin", () => {
  setup(() => {

  });

  suite("getTestName", () => {
    let getTestName;

    setup(() => {
      getTestName = plugin.__get__("getTestName");
    });

    test("should combine arry to correct test name", () => {
      const testNames = ["path/to/some/test/suite/file", "top level suite in file", "second level suite in file", "actual test"];
      const result = getTestName(testNames);
      expect(result).to.equal("top level suite in file - second level suite in file - actual test");
    });
  });

  suite("getTestEnvironment", () => {
    let getTestEnvironment;

    setup(() => {
      getTestEnvironment = plugin.__get__("getTestEnvironment");
    });

    test("should return combined test environment from browser", () => {
      const browser = { browserName: "Chrome", version: "64" };
      const result = getTestEnvironment(browser);
      expect(result).to.equal("Chrome64");
    });
  });

  suite("getXrayStateFromWctState", () => {
    let getXrayStateFromWctState;
    const values = [
      { value: "passing", expected: "PASS" },
      { value: "failing", expected: "FAIL" }
    ];

    setup(() => {
      getXrayStateFromWctState = plugin.__get__("getXrayStateFromWctState");
    });

    values.forEach((testObject) => {
      test(`should return XRAY equivalent to ${testObject.value}`, () => {
        const result = getXrayStateFromWctState(testObject.value);
        expect(result).to.equal(testObject.expected);
      });
    });
  });

  suite("extractErrorMessage", () => {
    let extractErrorMessage;

    setup(() => {
      extractErrorMessage = plugin.__get__("extractErrorMessage");
    });

    test("should extract message from WCT error", () => {
      const error = {
        message: "Some error message",
        stack: "Some stacktrace"
      };
      const result = extractErrorMessage(error);
      expect(result).to.equal("Some error message");
    });
  });

  suite("formatMomentToXrayCompatibleDate", () => {
    let formatMomentToXrayCompatibleDate;

    setup(() => {
      formatMomentToXrayCompatibleDate = plugin.__get__("formatMomentToXrayCompatibleDate");
    });

    test("should return the correct time string", () => {
      const date = moment("2018-03-19T09:47:40.123");
      const result = formatMomentToXrayCompatibleDate(date);
      expect(result).to.equal("2018-03-19T09:47:40+01:00");
    });
  });

  suite("filterTestsByJiraIssueKey", () => {
    let filterTestsByJiraIssueKey;

    setup(() => {
      filterTestsByJiraIssueKey = plugin.__get__("filterTestsByJiraIssueKey");
    });

    test("should filter all tests with JIRA issue key", () => {
      const tests = [
        { name: "Some test without issue key" },
        { name: "Some test without issue key that looks like it hase an issue key-1234" },
        { name: "Some test that actually has an issue key @key-1234" },
        { name: "Some test that actually has an issue key (key-1234) specified multiple times @key-4321" }
      ];
      const result = filterTestsByJiraIssueKey(tests);
      const expected = [
        { name: "key-1234" },
        { name: "key-4321" }
      ];
      expect(result).to.deep.equal(expected);
    });
  });

  suite("parseCustomFields", () => {
    let parseCustomFields;

    setup(() => {
      parseCustomFields = plugin.__get__("parseCustomFields");
    });

    test("should extract all keys and value", () => {
      const customFields = [
        "key1:value1",
        "key2:value2"
      ];
      const result = parseCustomFields(customFields);
      const expected = [
        { key: "key1", value: "value1" },
        { key: "key2", value: "value2" }
      ];
      expect(result).to.deep.equal(expected);
    });

    test("should not fail, if cli argument passed incorrectly", () => {
      const customFields = [
        "key1",
        ""
      ];
      const result = parseCustomFields(customFields);
      const expected = [
        { key: "key1", value: "" }
      ];
      expect(result).to.deep.equal(expected);
    });
  });

  suite("checkAndExpandOptions", () => {
    let checkAndExpandOptions;

    setup(() => {
      checkAndExpandOptions = plugin.__get__("checkAndExpandOptions");
    });

    test("should return false if no host is set", () => {
      const result = checkAndExpandOptions(null);
      expect(result).to.be.false;
    });

    test("should return false if no authorization is set", () => {
      const result = checkAndExpandOptions({jiraHost: "someHost"});
      expect(result).to.be.false;
    });

    test("should set default options", () => {
      const options = {
        jiraHost: "someHost",
        jiraAuthorization: "Basic abcdef0123456789",
      };
      const result = checkAndExpandOptions(options);
      const expected = {
        port: 80,
        host: "someHost",
        authorization: "Basic abcdef0123456789",
      };
      expect(result).to.deep.equal(expected);
    });
  });

  suite("createXrayJson", () => {
    let createXrayJson;

    setup(() => {
      createXrayJson = plugin.__get__("createXrayJson");
    });

    test("should return the correct time string", () => {
      const data = [{
        name: "Test 1",
        start: "2018-03-19T10:05:00+01:00",
        end: "2018-03-19T10:05:01+01:00",
        status: "PASS"
      }, {
        name: "Test 2",
        start: "2018-03-19T10:05:02+01:00",
        end: "2018-03-19T10:05:03+01:00",
        status: "FAIL",
        error: "Some error message"
      }];
      const start = "2018-03-19T10:04:50+01:00";
      const finish = "2018-03-19T10:05:10+01:00";
      const enviroment = "Chrome64";
      const result = createXrayJson(data, start, finish, enviroment, null);
      const expected = `{
  "info": {
    "summary": "Test execution for Web Component Tests",
    "description": "Automatically generated from Web Component Test results",
    "revision": "1.0.0",
    "startDate": "${start}",
    "finishDate": "${finish}"
  },
  "tests": [
    {
      "testKey": "Test 1",
      "start": "2018-03-19T10:05:00+01:00",
      "finish": "2018-03-19T10:05:01+01:00",
      "status": "PASS"
    },
    {
      "testKey": "Test 2",
      "start": "2018-03-19T10:05:02+01:00",
      "finish": "2018-03-19T10:05:03+01:00",
      "comment": "Some error message",
      "status": "FAIL"
    }
  ]
}`;
      expect(result).to.equal(expected);
    });

    test("should add custom fields", () => {
      const data = [{
        name: "Test 1",
        start: "2018-03-19T10:05:00+01:00",
        end: "2018-03-19T10:05:01+01:00",
        status: "PASS"
      }];
      const start = "2018-03-19T10:04:50+01:00";
      const finish = "2018-03-19T10:05:10+01:00";
      const enviroment = "Chrome64";
      const customFields = [
        { key: "one", value: "two" },
        { key: "three", value: "four" }
      ];
      const result = createXrayJson(data, start, finish, enviroment, customFields);
      const expected = `{
  "info": {
    "summary": "Test execution for Web Component Tests",
    "description": "Automatically generated from Web Component Test results",
    "revision": "1.0.0",
    "startDate": "${start}",
    "finishDate": "${finish}",
    "one": "two",
    "three": "four"
  },
  "tests": [
    {
      "testKey": "Test 1",
      "start": "2018-03-19T10:05:00+01:00",
      "finish": "2018-03-19T10:05:01+01:00",
      "status": "PASS"
    }
  ]
}`;
      expect(result).to.equal(expected);
    });
  });
});
