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
  appStage = "License is Issued - Upload Documents";
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
      AML_Connected: true
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
  let entity_id = entity.EntityId;
  ZOHO.CRM.API.getRecord({ Entity: "Applications1", approved: "both", RecordID: entity_id, Trigger: ["workflow"]})
    .then((data) => {
      const appData = data.data[0];
      accountId = appData.Account_Name.id;
      prospectId = appData.Deal_Name.id;
      licenseJurisdiction = appData.License_Jurisdiction;

      // Fetch Prospect Data
      ZOHO.CRM.API.getRecord({ Entity: "Deals", RecordID: prospectId })
        .then((data) => {
          const prospectData = data.data[0];
          prospectStage = prospectData.Stage;
          dbClearance = prospectData.Clearance_for_Dashboard_Commission;
          processClearance = prospectData.Clearance_for_Processing;

          // Check criteria
          if (prospectStage === "Closed Won" && dbClearance === true && processClearance === true) {
            // Pass the callback function to createLicenseRecord
            createLicenseRecord((applicationId) => {
              console.log("New License Application created with ID:", applicationId);

              // Now open the application URL
              openApplicationUrl(applicationId);

              // Show success message
              const message = "New License Application created successfully!";
              showPopup(message, "success");

              // Close the popup after the record creation is successful
              ZOHO.CRM.UI.Popup.close();
            });
            console.log("Stage: " + prospectStage);
            console.log("Clearance for DB&C: " + dbClearance);
            console.log("Clearance for Process: " + processClearance);
          } else {
            const message = "Cannot convert record. Ensure the Prospect is Closed Won and has Finance Clearance. Close the pop-up to exit";
            showPopup(message);
          }
        });
    })
    .catch((error) => console.error("Error fetching record data:", error));
});

function hidePopup() {
  // Close the Zoho CRM popup
  ZOHO.CRM.UI.Popup.close();
  console.log("CLOSE T F UP");
}

// Initialize the embedded app
ZOHO.embeddedApp.init();
