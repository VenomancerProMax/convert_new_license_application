let prospectId, accountId, prospectStage, dbClearance, processClearance, licenseJurisdiction, applicationId;

function showStatusModal(title, message, isError = false) {
  const modal = document.getElementById("custom-modal");
  const iconSuccess = document.getElementById("modal-icon-success");
  const iconError = document.getElementById("modal-icon-error");
  const modalBtn = document.getElementById("modal-close");
  
  document.getElementById("modal-title").textContent = title;
  document.getElementById("modal-message").textContent = message;

  if (isError) {
    iconSuccess.classList.add("hidden");
    iconError.classList.remove("hidden");
    modalBtn.classList.remove("hidden");
    modalBtn.onclick = () => ZOHO.CRM.UI.Popup.close();
  } else {
    iconSuccess.classList.remove("hidden");
    iconError.classList.add("hidden");
    modalBtn.classList.add("hidden");
  }
  
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function createLicenseRecord(callback) {
  const appType = "New Trade License";
  const appRemarks = "Continued from security approval to new trade License";
  const appStage = "Submitted to Authority";
  const layoutId = "3769920000104212264";

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
    if (response.data && response.data.length > 0) {
      applicationId = response.data[0].details.id;
      callback(applicationId);
    }
  })
  .catch((err) => {
    showStatusModal("Error", "Failed to create record.", true);
  });
}

function openApplicationUrl(id) {
  const url = "https://crm.zoho.com/crm/org682300086/tab/CustomModule3/" + id;
  window.open(url, '_blank').focus();
}

async function handleInstantTransition(newId) {
  openApplicationUrl(newId);
  showStatusModal("Success", "Record created. Closing...");

  try {
    await ZOHO.CRM.BLUEPRINT.proceed();
    setTimeout(() => {
      ZOHO.CRM.UI.Popup.closeReload();
    }, 1000);
  } catch (e) {
    ZOHO.CRM.UI.Popup.closeReload();
  }
}

ZOHO.embeddedApp.on("PageLoad", (entity) => {
  ZOHO.CRM.API.getRecord({ Entity: "Applications1", approved: "both", RecordID: entity.EntityId, Trigger: ["workflow"] })
    .then((data) => {
      const appData = data.data[0];
      accountId = appData.Account_Name.id;
      const accountName = appData.Account_Name.name;
      licenseJurisdiction = appData.License_Jurisdiction;

      ZOHO.CRM.API.searchRecord({ Entity: "Deals", Type: "word", Query: accountName, page: 1, per_page: 200 })
        .then((response) => {
          if (!response || !response.data) {
            showStatusModal("Not Found", "No matching prospect found.", true);
            return;
          }

          const matchingRecord = response.data.find((record) => record.Type === "New Trade License");
          if (matchingRecord) {
            prospectId = matchingRecord.id;

            ZOHO.CRM.API.getRecord({ Entity: "Deals", RecordID: prospectId })
              .then((data) => {
                const pData = data.data[0];
                prospectStage = pData.Stage;
                dbClearance = pData.Clearance_for_Dashboard_Commission;
                processClearance = pData.Clearance_for_Processing;

                if (prospectStage === "Closed Won" && dbClearance === true && processClearance === true) {
                  createLicenseRecord((newId) => {
                    handleInstantTransition(newId);
                  });
                } else {
                  showStatusModal("Restricted", "Prospect must be Closed Won with finance clearance.", true);
                }
              });
          } else {
            showStatusModal("Restricted", "No matching 'New Trade License' prospect found.", true);
          }
        });
    })
    .catch((error) => console.error(error));
});

ZOHO.embeddedApp.init();