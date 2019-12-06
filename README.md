# GoogleAppsScripts_PipedriveWriter
This general purpose script can send any JS Object to the Pipedrive API to conveniently update records from Google Apps Script.
For more details see the JDoc annotations or contact me.

## Setup
You will need to set `pipedriveApiToken` before using the script. That can be done from "File > Project Properties".  
Here's a guide for accessing Script Properties: https://developers.google.com/apps-script/reference/properties/properties.html  

## Deployment within your Google org
If you want to share this with your colleagues, you can deploy the code as a Library throughout your Google organization by sharing the script code and creating a published Version.  
However, people will be using your API key from the script Properties. If that is not desired, you'll have to make some adjustments.

Here's a guide for deployment of Google Apps Scripts libraries: https://developers.google.com/apps-script/guides/libraries


## Fair Warning:
I haven't fully tested this general purpose library. It was written and tested in a slightly more specific use-case, where it runs without failure.  
If there are any issues, please let me know and I will help to fix them. :)

## Knock yourself out using this script - would be happy for any feedback though!