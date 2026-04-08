let prospectId, accountId, prospectStage, dbClearance, processClearance, licenseJurisdiction, applicationId;

function showPopup(type, title, message) {
  const modal = document.getElementById("custom-modal");
  const iconSuccess = document.getElementById("modal-icon-success");
  const iconError = document.getElementById("modal-icon-error");
  const modalBtn = document.getElementById("modal-close");
  
  document.getElementById("modal-title").textContent = title;
  document.getElementById("modal-message").textContent = message;
  
  modalBtn.onclick = closeModal;

  if (type === "success") { 
    iconSuccess.classList.remove("hidden"); 
    iconError.classList.add("hidden");
    
    modalBtn.onclick = async () => {
      modalBtn.disabled = true;
      modalBtn.textContent = "Finalizing...";
      try {
        await ZOHO.CRM.BLUEPRINT.proceed();
        setTimeout(() => {
          window.top.location.href = window.top.location.href;
        }, 800);
      } catch (e) {
        ZOHO.CRM.UI.Popup.closeReload();
      }
    };
  } else { 
    iconSuccess.classList.add("hidden"); 
    iconError.classList.remove("hidden"); 
    modalBtn.onclick = () => ZOHO.CRM.UI.Popup.close();
  }
  
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function closeModal() {
  const modal = document.getElementById("custom-modal");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
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
  .catch((error) => console.error(error));
}

function openApplicationUrl(id) {
  const url = "https://crm.zoho.com/crm/org682300086/tab/CustomModule3/" + id;
  window.open(url, '_blank').focus();
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
          if (!response.data) {
            showPopup("error", "Not Found", "No matching prospect found.");
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
                    openApplicationUrl(newId);
                    showPopup("success", "Success!", "Application created successfully. Click OK to proceed.");
                  });
                } else {
                  showPopup("error", "Restricted", "Note that there are no existing new trade license prospect that is closed won and clearance by finance.");
                }
              });
          } else {
            showPopup("error", "Restricted", "No matching 'New Trade License' prospect found.");
          }
        });
    })
    .catch((error) => console.error(error));
});

ZOHO.embeddedApp.init();