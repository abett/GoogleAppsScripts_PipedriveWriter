/**
 *  Please set the following script-properties (https://developers.google.com/apps-script/reference/properties/properties.html) before using:
 *  - pipedriveApiToken
 * That can be done from "File > Project Properties".  
*/


/**
 *  Test the Deal Title submission with Test Deal https://<pipedriveSubdomain>.pipedrive.com/deal/<dealId>
 *  This writes a current timestamp into this Deal's Title field. 
 *  Returns true if all tests were passed without crashing the script execution.
 *
 *  @param {number} dealId
 *  @return {boolean}
 *
 */
function testPdUpdate(dealId) {
  try{
    // send one request to update the Deal title and Organization Name as a test
    sendDealTitleToPipedrive(dealId, 'test@'+Utilities.formatDate(new Date(), 'PST', 'HH:mm'));
    
    Logger.log('made it no prob');
    return true;
    
  } catch(error) {
    console.error(error);
    
    return false;
  }
}


/**
 *  Updates the Deal Title and Organization Name related to a provided Deal Id with the supplied dealTitle. 
 *  This is mainly supposed to serve as a guide on how to use the general-purpose function pdUpdate.
 *  Please make sure you have the initially described script-properties set on your end.
 *  On sucess, this returns a link to the Deal on PD
 *
 *  @param {number} pipedriveDealId 
 *  @param {number} dealTitle
 *  @return {string}
 *
 */
function sendDealTitleToPipedrive(pipedriveDealId, dealTitle) {
  try{
    //-------------------- BEGIN sanity checks -------------------//
    if(!dealTitle) throw('no Deal Title provided!');
    
    // make sure that the Deal Id is a valid integer
    var pipedriveDealId = parseInt(pipedriveDealId) || -1;
    if(!(pipedriveDealId > 0)) throw('invalid Pipedrive Deal ID: ' + pipedriveDealId);
    //--------------------- END sanity checks --------------------//
    
    
    
    //-------------- BEGIN setting data for API push -------------//
    
    /*
    *  YOU CAN ADD MORE FIELDS TO PUSH to the Pipedrive ORGANIZATION here.
    *  for that you will need to use the correct field-key (the 40 digit UID) and make sure the data type is gonna be accepted.
    *  -> field information can be found here: https://<pipedriveSubdomain>.pipedrive.com/settings/table_column/edit/org
    */
    var orgUpdateData = {
      name: dealTitle
    };
    
    /* 
    *  YOU CAN ADD MORE FIELDS TO PUSH to the Pipedrive DEAL here.
    *  for that you will need to use the correct field-key (the 40 digit UID) and make sure the data type is gonna be accepted.
    *  -> field information can be found here: https://<pipedriveSubdomain>.pipedrive.com/settings/table_column/edit/deals
    */
    var dealUpdateData = {
      title: dealTitle
    };
    
    
    /*
    *  YOU CAN SET THIS NOTE FREELY
    */
    var dealNoteText = 'This Deal has been renamed to "'+dealTitle+'".<br><br>' +
      '<i>Time received '+Utilities.formatDate(new Date(), 'PST', 'yyyy-MM-dd HH:mm')+'</i>';
    
    //--------------- END setting data for API push --------------//
    
    
    var pdUpdateSuccess = pdUpdate(pipedriveDealId, dealUpdateData, orgUpdateData, dealNoteText);
    if(!pdUpdateSuccess) throw('Pipedrive update for Deal '+pipedriveDealId+' failed.');
    
    var pipedriveDealUrl = 'https://<pipedriveSubdomain>.pipedrive.com/deal/'+pipedriveDealId;
    
  } catch(error) {
    console.error(error);
    
    var pipedriveDealUrl = undefined;
  }
  
  return pipedriveDealUrl; 
}


/**
 *  Updates the Deal and Organization related to a provided Deal Id with the supplied field values. 
 *  This takes an Object of field key-value pairs for both the Deal and the Org associated to the Deal Id. Furthermore it allows to add a Note.
 *  Returns true upon succesful update and false if some error occured.
 *
 *  @param {number} pipedriveDealId 
 *  @param {Object} dealUpdateData 
 *  @param {Object} orgUpdateData 
 *  @param {string} dealNoteText
 *  @return {boolean}
 *
 */
function pdUpdate(pipedriveDealId, dealUpdateData, orgUpdateData, dealNoteText) {
  try {
    /*
    *  The API token needs to be stored in Google Apps Script Properties
    *  An Admin User's token can be found here: https://<pipedriveSubdomain>.pipedrive.com/settings/personal/api
    */
    var scriptProps = PropertiesService.getScriptProperties();
    var pipedriveApiToken = scriptProps.getProperty('pipedriveApiToken');
    
    //-------------------- BEGIN sanity checks -------------------//
    if(!pipedriveApiToken) throw('couldn\'t find Pipedrive API token.Make sure it is stored in the Script Properties!');
    if(!(pipedriveDealId > 0)) throw('invalid Pipedrive Deal ID: ' + pipedriveDealId);
    //--------------------- END sanity checks --------------------//
    
    
    //------------ BEGIN pipedrive DEAL data RETRIEVAL -----------//
    
    // attempt to fetch the deal record from Pipedrive
    // API docs for this endpoint: https://developers.pipedrive.com/docs/api/v1/#!/Deals/get_deals_id
    var dealGetResult = UrlFetchApp.fetch('https://api.pipedrive.com/v1/deals/'+pipedriveDealId+'?api_token='+pipedriveApiToken, {'method':'GET'});
    
    if (dealGetResult.getResponseCode() != 200) throw('couldn\'t retrieve Pipedrive Deal ' + pipedriveDealId);
    
    var pipedriveDealData = JSON.parse(dealGetResult.getContentText());
    
    // if needed you can retrieve more Deal fields here.
    // check the API doc (https://developers.pipedrive.com/docs/api/v1/#!/Deals/get_deals_id) to understand the structure of the response
    var pipedriveOrgId = pipedriveDealData.data.org_id.value;
    
    if(!pipedriveOrgId) throw('couldn\'t retrieve an Org ID');
    
    //------------- END pipedrive DEAL data RETRIEVAL ------------//
    
    
    
    
    //-------- BEGIN pipedrive ORGANIZATION field update ---------//
    /*
    *  sends the provided key-value pairs to the Pipedrive Org.
    *  check https://<pipedriveSubdomain>.pipedrive.com/settings/table_column/edit/org for which fields are Org-fields.
    */
    if(Object.keys(orgUpdateData).length > 0) { 
      // API docs for this endpoint: https://developers.pipedrive.com/docs/api/v1/#!/Organizations/put_organizations_id
      var orgUpdateUrl = 'https://api.pipedrive.com/v1/organizations/'+pipedriveOrgId+'?api_token='+pipedriveApiToken;
      
      var orgUpdateOptions = {
        'method' : 'PUT',
        'contentType': 'application/json',
        // Convert the JavaScript object to a JSON string.
        'payload' : JSON.stringify(orgUpdateData)
      };
      var orgUpdateResult = UrlFetchApp.fetch(orgUpdateUrl, orgUpdateOptions);
      
      if (orgUpdateResult.getResponseCode() != 200) throw('couldn\'t update Pipedrive Org '+pipedriveOrgId+' with '+Object.keys(orgUpdateData).reduce(function(a,b){return a+', '+b+': '+orgUpdateData[b];},''));
    }
    //--------- END pipedrive ORGANIZATION field update ----------//
    
    
    
    
    //------------- BEGIN pipedrive DEAL field update ------------//
    /*
    *  sends the provided key-value pairs to the Pipedrive Deal.
    *  check https://<pipedriveSubdomain>.pipedrive.com/settings/table_column/edit/deals for which fields are Deal-fields.
    */
    if(Object.keys(dealUpdateData).length > 0) { 
      // API docs for this endpoint: https://developers.pipedrive.com/docs/api/v1/#!/Deals/put_deals_id
      var dealUpdateUrl = 'https://api.pipedrive.com/v1/deals/'+pipedriveDealId+'?api_token='+pipedriveApiToken;
      
      var dealUpdateOptions = {
        'method' : 'PUT',
        'contentType': 'application/json',
        // Convert the JavaScript object to a JSON string.
        'payload' : JSON.stringify(dealUpdateData)
      };
      var dealUpdateResult = UrlFetchApp.fetch(dealUpdateUrl, dealUpdateOptions);
      
      if (dealUpdateResult.getResponseCode() != 200) throw('couldn\'t update Pipedrive Deal '+pipedriveDealId+' with '+Object.keys(dealUpdateData).reduce(function(a,b){return a+', '+b+': '+dealUpdateData[b];},''));
    }
    //-------------- END pipedrive DEAL field update -------------//
    
    
    
    
    //------------- BEGIN pipedrive NOTE attachment --------------//
    /*
    *  sends the provided dealNoteText to Pipedrive and attaches it to both the Deal and the Org.
    */
    if(dealNoteText && !/^\s*$/.test(dealNoteText)) { 
      // API docs for this endpoint: https://developers.pipedrive.com/docs/api/v1/#!/Notes/post_notes
      var noteInsertUrl = 'https://api.pipedrive.com/v1/notes?api_token='+pipedriveApiToken;
      
      var noteInsertData = {
        content: dealNoteText,
        deal_id: pipedriveDealId,
        org_id: pipedriveOrgId
      };
      
      var noteInsertOptions = {
        'method' : 'POST',
        'contentType': 'application/json',
        // Convert the JavaScript object to a JSON string.
        'payload' : JSON.stringify(noteInsertData)
      };
      var noteInsertResult = UrlFetchApp.fetch(noteInsertUrl, noteInsertOptions);
      
      if (noteInsertResult.getResponseCode() != 201) throw('couldn\'t add note "'+dealNoteText+'" to Deal '+pipedriveDealId+' and Org '+pipedriveOrgId);
    }
    //-------------- END pipedrive NOTE attachment ---------------//
    
  } catch(error) {
    console.error(error);
    
    return false;
  }
  
  return true;
}
