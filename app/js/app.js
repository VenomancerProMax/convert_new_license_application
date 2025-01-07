let prospectId, accountId, prospectStage, dbClearance, processClearance, licenseJurisdiction;

// Function to display a popup with a custom message
function showPopup(message) {
  const popup = document.getElementById("popup");
  const popupMessage = document.getElementById("popupMessage");
  popupMessage.textContent = message;
  popup.classList.remove("hidden");
}

// Function to hide the popup
function hidePopup() {
  const popup = document.getElementById("popup");
  popup.classList.add("hidden");
}

// Function to create a new license record
function createLicenseRecord() {
  ZOHO.CRM.API.insertRecord({
    Entity: "Applications1",
    APIData: {
      Account_Name: accountId,
      Deal_Name: prospectId,
      License_Jurisdiction: licenseJurisdiction,
    },
  })
    .then((response) => {
      console.log("Record created successfully:", response);
      alert("New License Application created successfully!");
    })
    .catch((error) => {
      console.error("Error creating record:", error);
      alert("Failed to create the record. Please try again.");
    });
}

// Widget onload logic
ZOHO.embeddedApp.on("PageLoad", (entity) => {
  let entity_id = entity.EntityId[0];

  ZOHO.CRM.API.getRecord({ Entity: "Applications1", approved: "both", RecordID: entity_id })
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
            createLicenseRecord();
          } else {
            const message =
              "Cannot convert record. Ensure the Prospect is Closed Won and has Finance Clearance. Close the pop-up to exit";
            showPopup(message);
          }
        });
    })
    .catch((error) => console.error("Error fetching record data:", error));
});


// Initialize the embedded app
ZOHO.embeddedApp.init();
