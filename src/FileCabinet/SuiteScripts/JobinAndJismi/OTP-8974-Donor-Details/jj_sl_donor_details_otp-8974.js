/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
/**********************************************************************************************
************
*
*
*
${OTP-8974}:{Custom form to store blood donor details and track them in database}
*
*
**************************************************************************************************
*
*Author:Jobin and Jismi IT Services
*
*Date Created:17-June-2025
*
*Description:This script is developed to create a custom form to fetch the details of blood donors –
*donor name(first name, last name), phone number, blood group, gender and the most recent blood 
*donation date. After the user clicks on the ‘Submit Donor Data’ button,  a custom record
*will be created in NetSuite to store the form data. 
*
** REVISION HISTORY
 *
* @version 1.0 17-June-2025 : Created the initial build by JJ0403
***************************************************************************************************
*************/

define(['N/log', 'N/record', 'N/ui/serverWidget', 'N/search'],
    /**
     * @param{log} log
     * @param{record} record
     * @param{serverWidget} serverWidget
     * @param{search} search 
     */
    (log, record, serverWidget, search) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            try {
                if (scriptContext.request.method === 'GET') {
                    const form = createDonorForm();
                    scriptContext.response.writePage(form);
                } else {
                    const donorData = {
                        fname: scriptContext.request.parameters.first_name,
                        lname: scriptContext.request.parameters.last_name,
                        gender: scriptContext.request.parameters.custpage_gender,
                        phono: scriptContext.request.parameters.custpage_phno,
                        bldgrp: scriptContext.request.parameters.blood_group,
                        lstdondate: scriptContext.request.parameters.last_donation_date
                    };

                    if (validateDonorEntry(donorData)) {
                        scriptContext.response.write("Donor record already exists!");
                    } else {
                        const recordId = createExternalDonorRecord(donorData);
                        scriptContext.response.write(`Donor record created successfully! Internal ID: ${recordId}`);
                    }
                }

            } catch (error) {
                log.error('Unexpected Error occurred', error);
            }
        };

        const createDonorForm = () => {
            const form = serverWidget.createForm({
                title: 'External Donor form'
            });

            form.addField({
                id: 'first_name',
                type: serverWidget.FieldType.TEXT,
                label: 'First Name'
            }).isMandatory = true;

            form.addField({
                id: 'last_name',
                type: serverWidget.FieldType.TEXT,
                label: 'Last Name'
            }).isMandatory = true;

            form.addField({
                id: 'custpage_gender',
                type: serverWidget.FieldType.SELECT,
                label: 'Gender',
                source: 'customlist_jj_gender'
            }).isMandatory = true;

            form.addField({
                id: 'custpage_phno',
                type: serverWidget.FieldType.PHONE,
                label: 'Phone Number'
            }).isMandatory = true;

            form.addField({
                id: 'blood_group',
                type: serverWidget.FieldType.SELECT,
                label: 'Blood Group',
                source: 'customlist_jj_blood_grp'
            }).isMandatory = true;

            form.addField({
                id: 'last_donation_date',
                type: serverWidget.FieldType.DATE,
                label: 'Last Donation Date'
            }).isMandatory = true;

            form.addSubmitButton({ label: 'Submit' });
            return form;
        };

        function convertDate(date) {
            try {
                let convertdate = new Date(date);
                let convertmonth = convertdate.getMonth() + 1;
                let convertday = convertdate.getDate();
                let convertyear = convertdate.getFullYear();

                let newMonth = convertmonth < 10 ? "0" + convertmonth.toString() : convertmonth.toString();
                let newDay = convertday < 10 ? "0" + convertday.toString() : convertday.toString();

                let newdate = [convertyear, newMonth, newDay].join("-");
                let formattedDate = new Date(newdate);

                return formattedDate;
                
            } catch (error) {
                log.error('Unexpected Error occurred', error);
            }
        }

        function validateDonorEntry(donorData) {
            try{
                let donorSearch = search.create({
                    type: 'customrecord_jj_blood_donor_detials',
                    filters: [
                        ['custrecord_jj_first_name', 'is', donorData.fname],
                        'AND',
                        ['custrecord_jj_last_name', 'is', donorData.lname],
                        'AND',
                        ['custrecord_jj_phone_number', 'is', donorData.phono]
                    ],
                    columns: ['internalid']
                });

                let existingDonor = false;
                donorSearch.run().each(function (result) {
                    existingDonor = true;
                    return false;
                });

                return existingDonor;
            } catch (error) {
                log.error('Unexpected Error occurred', error);
            }
        }

        const createExternalDonorRecord = (donorData) => {
            try{
                const lastDate = convertDate(donorData.lstdondate);

                const ExternalRecord = record.create({
                    type: 'customrecord_jj_blood_donor_detials'
                });

                ExternalRecord.setValue({ fieldId: "custrecord_jj_first_name", value: donorData.fname });
                ExternalRecord.setValue({ fieldId: "custrecord_jj_last_name", value: donorData.lname });
                ExternalRecord.setValue({ fieldId: "custrecord_jj_gender", value: donorData.gender });
                ExternalRecord.setValue({ fieldId: "custrecord_jj_phone_number", value: donorData.phono });
                ExternalRecord.setValue({ fieldId: "custrecord_jj_bld_group", value: donorData.bldgrp });
                ExternalRecord.setValue({ fieldId: "custrecord_jj_last_donation_date", value: lastDate });

                return ExternalRecord.save({ ignoreMandatoryFields: true });
            } catch (error) {
                log.error('Unexpected Error occurred', error);
            }
        };

        return { onRequest };
    });
