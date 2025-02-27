let prospectId, accountId, prospectStage, dbClearance, processClearance, licenseJurisdiction, applicationId;

// Function to display a popup with a custom message
function showPopup(message, type = "restricted") {
  const popup = document.getElementById("popup");
  const popupMessage = document.getElementById("popupMessage");
  const popupTitle = document.getElementById("popupTitle");

  popupMessage.textContent = message;

  if (type === "success") {
    popup.classList.add("success");
    popup.classList.remove("restricted");
    popupTitle.textContent = "Success!";
  } else {
    popup.classList.add("restricted");
    popup.classList.remove("success");
    popupTitle.textContent = "Action Restricted";
  }

  popup.classList.remove("hidden");
}

// Function to create a new license record
function createLicenseRecord(callback) {
  appType = "New Trade License";
  appRemarks = "Continued from security approval to new trade License";
  appStage = "Submitted to Authority";
  layoutId = "3769920000104212264";

  ZOHO.CRM.API.insertRecord({
    Entity: "Applications1",
    APIData: {
      Account_Name: accountId,
      Deal_Name: prospectId,
      License_Jurisdiction: licenseJurisdiction,
      Type: appType,
      License_Remarks: appRemarks,
      New_Resident_Visa_Stage: appStage,
      Layout: layoutId,
      AML_Connected: true,
      Stage: "Submitted to Authority",
      Status: "Submitted"
    },
    Trigger: ["workflow"] 
  })
    .then((response) => {
      const applicationData = response.data;
      applicationData.map((record) => {
        applicationId = record.details.id;
        console.log("Record created successfully:", applicationId);
        
        // Call the callback with the applicationId once the record is created
        callback(applicationId);
      });
    })
    .catch((error) => {
      console.error("Error creating record:", error);
    });
}

// Function to open the application URL in a new tab
function openApplicationUrl(applicationId) {
  const application_url = "https://crm.zoho.com/crm/org682300086/tab/CustomModule3/" + applicationId;
  window.open(application_url, '_blank').focus();
}

// Widget onload logic
ZOHO.embeddedApp.on("PageLoad", (entity) => {
  console.log(entity);

  const entity_id = entity.EntityId;

  ZOHO.CRM.API.getRecord({ Entity: "Applications1", approved: "both", RecordID: entity_id, Trigger: ["workflow"] })
    .then((data) => {
      const appData = data.data[0];
      accountId = appData.Account_Name.id;
      accountName = appData.Account_Name.name;
      licenseJurisdiction = appData.License_Jurisdiction;

      // Search deals to find the prospect with "New Trade License" type
      ZOHO.CRM.API.searchRecord({ Entity: "Deals", Type: "word", Query: accountName, page: 1, per_page: 200 })
        .then((response) => {
          const records = response.data;

          // Find prospectId from matching records
          const matchingRecord = records.find((record) => record.Type === "New Trade License");
          if (matchingRecord) {
            console.log("PROSPECT ID:", matchingRecord.id);
            prospectId = matchingRecord.id;

            // Fetch Prospect Data
            ZOHO.CRM.API.getRecord({ Entity: "Deals", RecordID: prospectId })
              .then((data) => {
                const prospectData = data.data[0];
                prospectStage = prospectData.Stage;
                dbClearance = prospectData.Clearance_for_Dashboard_Commission;
                processClearance = prospectData.Clearance_for_Processing;

                console.log(prospectStage);
                console.log(dbClearance);
                console.log(processClearance);

                // Check criteria
                if (prospectStage === "Closed Won" && dbClearance === true && processClearance === true) {
                  // Create license record
                  createLicenseRecord((applicationId) => {
                    console.log("New License Application created with ID:", applicationId);

                    // Open the application URL
                    openApplicationUrl(applicationId);

                    // Show success message
                    const message = "New License Application created successfully!";
                    showPopup(message, "success");
                  });
                } else {
                  const message = "Note that there are no existing new trade license prospect that is closed won and clearance by finance. Please inform the BSC.";
                  showPopup(message);
                }
              });
          } else {
            console.log("No matching 'New Trade License' prospect found.");
            showPopup("No matching 'New Trade License' prospect found.");
          }
        })
        .catch((error) => console.error("Error searching deals:", error));
    })
    .catch((error) => console.error("Error fetching application record:", error));
});



function hidePopup() {
  if(prospectStage === "Closed Won" && dbClearance === true && processClearance === true)
  {
    // BLUEPRINT Proceeds to next stage
    ZOHO.CRM.BLUEPRINT.proceed();
  }
  ZOHO.CRM.UI.Popup.close();
}

// Initialize the embedded app
ZOHO.embeddedApp.init();
