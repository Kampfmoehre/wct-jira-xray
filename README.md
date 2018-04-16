# wct-jira-xray
A Web Component Tester Plugin to report test results to JIRA over XRAY API.
Use this plugin if you want to run Web Component Tests which are associated with JIRA issues and report the test execution to JIRA using the JIRA XRAY plugins rest API.

## Usage
Install Plugin with npm ```npm install git+https://git@github.com/Kampfmoehre/wct-jira-xray.git``` and configure it in wct.conf.json.

```json
"plugins": {
    "jira-xray": {
      "jiraHost": "jira.your-company.com",
      "jiraPort": 8080,
      "jiraAuthorization": "Basic somekey"
    }
  }
```

### Configuration

#### jiraHost
Type: `string`
The Uri to the Jira instance you want to push the results to

#### jiraPort
Type: `number`
The Port where the JIRA instance is running

#### jiraAuthorization
Type: `string`
The content of the authorization header that is used to authorize the request in JIRA

## Development
Be sure to run ```npm run lint``` before checking in to avoid linter errors.

### Test
Run ```npm run test``` to execute all unit tests.
