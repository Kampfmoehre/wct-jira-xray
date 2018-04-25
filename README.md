# wct-jira-xray
A Web Component Tester Plugin to report test results to JIRA over XRAY API.
Use this plugin if you want to run Web Component Tests which are associated with JIRA issues and report the Test Execution to JIRA using the JIRA XRAY plugins rest API.

## Usage
Install Plugin with npm ```npm install git+https://git@github.com/Kampfmoehre/wct-jira-xray.git``` and configure it in wct.conf.json.


### Configuration
```json
"plugins": {
    "jira-xray": {
      "jiraHost": "jira.your-company.com",
      "jiraPort": 8080,
      "jiraAuthorization": "Basic somekey"
    }
  }
```

#### jiraHost
Type: `string`
The Uri to the Jira instance you want to push the results to

#### jiraPort
Type: `number`
The Port where the JIRA instance is running

#### jiraAuthorization
Type: `string`
The content of the authorization header that is used to authorize the request in JIRA

### Command Line
You can also specify all options via Command Line. With this you can specify custom fields that your JIRA requires for an issue. Example:
Given your JIRA is configured, as such that every issue needs a value for the field `version` you could give the field as well as its value as additional command line argument by using the format `key:value`.

The plugin will then append this to the info object which is send to the XRAY rest API and then used to create the Test Execution.
When you want to use multiple values you can specify --custom-field Argument multiple times like
```wct --plugin jira-xray --custom-fields "version:1.2.3" --customFields "yourField:yourValue"```

## Development
Be sure to run ```npm run lint``` before checking in to avoid linter errors.

### Test
Run ```npm run test``` to execute all unit tests.
