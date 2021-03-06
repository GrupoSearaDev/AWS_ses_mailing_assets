exports = async function(changeEvent) {
  const { fullDocument } = changeEvent;
  const { systolic, diastolic, rfid, pulse, _id } = fullDocument;
  
  const companyId = fullDocument.companyId.toString();
  
  const mongo = context.services.get("Cluster0");
  
    const bps = mongo.db("CTi").collection("bloodpressures");
    const halfAndHourAgo = new Date().getTime() - (2100*1000);
    
      const secondLecture = await bps.find({ 
        rfid: rfid, 
        companyId: BSON.ObjectId(companyId), 
        createdAt:{ $gte: new Date(halfAndHourAgo) }
      }).toArray();
    
    const condition = secondLecture.some( function(e){
      if(companyId==="5f3d7f5e8c4b522e94c80675"){
        return (e.systolic <= 89 || e.diastolic <= 59 || e.systolic >= 129 || e.diastolic >= 86)        
      }else{
        return (e.systolic <= 89 || e.diastolic <= 59 || e.systolic >= 140 || e.diastolic >= 90)
      }
    });
    
    
    const ses = context.services.get('temp_notifications').ses("us-east-1");
    
    if(secondLecture.length>1 && condition){
    
      const companies = mongo.db("CTi").collection("companies");
      const currentCompany = await companies.findOne({ _id: BSON.ObjectId(companyId) }, {notificationEmails:1});
      const notificationEmails = currentCompany.notificationEmails;
      console.log(JSON.stringify(notificationEmails))
      
      const employees = mongo.db("CTi").collection("employees");
      const currentEmployee = await employees.findOne({ rfid: rfid, companyId: BSON.ObjectId(companyId) });
      console.log(JSON.stringify(currentEmployee))
      
      
      const BCCmails = ["1664859gustavonajera@gmail.com", "operaciones@gruposeara.com",  "ces@gruposeara.com"];

      var ses_mail = "From: Notificaciones Cardiotrack - Presion Arterial <seara.health@gmail.com>\n";
      ses_mail += "To: " + notificationEmails + "\n";
      // ses_mail += "Bcc: " + BCCmails + "\n";
      ses_mail += "Subject: " + currentEmployee.fullName + " tiene medidas de presión arterial alteradas." + "\n";
      ses_mail += "MIME-Version: 1.0\n";
      ses_mail += "Content-Type: multipart/mixed; boundary=\"NextPart\"\n\n";
      ses_mail += "--NextPart\n";
      ses_mail += "Content-Type: text/html\n\n";
      ses_mail += `<h3 style="display:inline">${currentEmployee.companyName}</h3>`;
      ses_mail += "<h4>Esta persona tiene medidas de presión arterial alteradas...</h4> ";
      ses_mail += `<b>Empleado:</b> ${currentEmployee.fullName},&nbsp;&nbsp;<b>CompanyEmployeeId:</b> ${currentEmployee.companyEmployeeId} <br>`;
      ses_mail += `<b>RFID:</b> ${rfid},&nbsp;&nbsp;<b>Empleado Externo:</b> ${currentEmployee.outsourcedEmployee} <br><br>`;  
      ses_mail += `<b>PRESIONES: </b>`;
      ses_mail += `Sistólica: ${systolic}, Diastólica: ${diastolic}, Pulso: ${pulse}`;
      ses_mail += "\n\n";
      ses_mail += "--NextPart--";
      
      if((systolic <= 89 || diastolic <= 59 || systolic >= 140 || diastolic >= 90) && companyId!=="5f3d7f5e8c4b522e94c80675"){
        const result = ses.SendRawEmail({
          Source: "seara.health@gmail.com",
          RawMessage: { Data: ses_mail }
        });
      }
      
      if((systolic <= 89 || diastolic <= 59 || systolic >= 129 || diastolic >= 86) && companyId==="5f3d7f5e8c4b522e94c80675"){
          const result = ses.SendRawEmail({
          Source: "seara.health@gmail.com",
          RawMessage: { Data: ses_mail }
        });
      }
      
      console.log(JSON.stringify(currentEmployee));
    }
};