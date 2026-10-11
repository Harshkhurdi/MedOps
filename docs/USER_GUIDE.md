# MedOps - Complete User Guide

From first sign-in to tenders, orders, service, finance and reporting

Edition: 9 October 2026 | Application baseline: 2c268d8

Application: [Open MedOps](https://medops-seven.vercel.app)

## How to use this guide

Start with chapters 1-3 if you have never used MedOps. Follow chapter 4 for a complete worked example. Chapters 5-16 explain the individual workflows. Chapter 17 is the problem-solving guide. The final appendices list every register, every form field and the available choices.

Instructions describe the released application and its saved-record rules. Your administrator may give you access to only part of it. A hidden page or disabled action often means a permission is missing. Optional email, private OCR, Tender Tracker and AI features depend on configuration; their presence in this guide does not mean your account has them enabled.

All example institutions, references, serial numbers and amounts in this guide are fictional teaching examples. Do not create them in the live company workspace. Use real approved business information in production, or ask your operator for a separate training environment.

## Contents

- [1. What MedOps does](#1-what-medops-does)
- [2. First sign-in and everyday controls](#2-first-sign-in-and-everyday-controls)
- [3. Administrator: set up an empty workspace](#3-administrator-set-up-an-empty-workspace)
- [4. A complete teaching example](#4-a-complete-teaching-example)
- [5. Tenders, source review and bid controls](#5-tenders-source-review-and-bid-controls)
- [6. RFQs, quotations and commercial comparison](#6-rfqs-quotations-and-commercial-comparison)
- [7. Company documents, templates and generation](#7-company-documents-templates-and-generation)
- [8. Purchase orders, deliveries and installation](#8-purchase-orders-deliveries-and-installation)
- [9. Warranty, AMC and consumable growth](#9-warranty-amc-and-consumable-growth)
- [10. Service desk, engineer work and spare parts](#10-service-desk-engineer-work-and-spare-parts)
- [11. Invoices, receipts, corrections and costs](#11-invoices-receipts-corrections-and-costs)
- [12. CRM, contacts and sales pipeline](#12-crm-contacts-and-sales-pipeline)
- [13. Daily work, search, dashboards and reports](#13-daily-work-search-dashboards-and-reports)
- [14. Historical entry and controlled imports](#14-historical-entry-and-controlled-imports)
- [15. Optional text assistance and extraction](#15-optional-text-assistance-and-extraction)
- [16. Administrator and operator routine](#16-administrator-and-operator-routine)
- [17. Problems, limits and safe corrections](#17-problems-limits-and-safe-corrections)
- [18. Permissions and workflow reference](#18-permissions-and-workflow-reference)
- [Appendix A. Every page at a glance](#appendix-a-every-page-at-a-glance)
- [Appendix B. Complete field reference](#appendix-b-complete-field-reference)
- [Appendix C. Generator source and placeholder reference](#appendix-c-generator-source-and-placeholder-reference)

# 1. What MedOps does

MedOps keeps the work of a medical equipment dealership connected. It stores the opportunity, the documents used for a bid, the customer's official order, dispatched quantities, individual serial-numbered devices, service contracts, invoices and receipts.

The usual sequence is:

1. Set up company information, employees, customers, manufacturers and products.
2. Record a tender or sales opportunity and decide whether to pursue it.
3. Request manufacturer quotations, compare actual costs and prepare the bid.
4. Review documents and record the real submission and outcome.
5. Record and confirm the customer's official purchase order.
6. Dispatch equipment, confirm receipt and register each serial number.
7. Record installation, contractual warranty and AMC/service work.
8. Record invoices, receipts, follow-ups, actual costs and corrections.
9. Review deadlines, outstanding balances, performance and reports.

You can also start with a direct order, a historical installed device or a service complaint. Every workflow does not have to begin with a tender. Normal downstream records still need their required real links; administrators have specific historical-entry options for older business.

## Important words

| Term | Meaning in MedOps |
| --- | --- |
| Register | A saved list, such as Customers, RFQs or Invoices. |
| Record | One saved entry in a register. |
| Linked record | An existing customer, order, device or other entry selected in a form. |
| Tender | A procurement opportunity and its requirements, deadlines and bid evidence. |
| RFQ | Request for quotation sent to a manufacturer. |
| Quotation revision | A new retained version of a manufacturer's quoted terms. |
| PO | The customer's official purchase order. MedOps records it; it does not fabricate one. |
| Installed base | The individual devices you track, identified by serial number. |
| AMC | Annual maintenance contract; the app also records its actual dates and service interval. |
| SLA | Service-level targets for assignment, first visit and resolution. |
| EMD / PBG | Earnest money deposit / performance bank guarantee. |
| Outstanding | Adjusted invoice charges minus effective receipts. |
| Historical | Actual older business entered by an administrator with its original date. |
| Immutable | Retained history that cannot be overwritten through Edit. |
| Record ID | The app's internal identifier, different from a PO, tender or invoice number. |

# 2. First sign-in and everyday controls

## 2.1 Get an account and sign in

1. Ask your company administrator for your account email and initial password. There is no public registration and no shared default login.
2. Open [MedOps](https://medops-seven.vercel.app/login).
3. Enter **Email** and **Password**. Select **Sign in** once the page is ready.
4. You will normally arrive at **Operations overview**. The navigation shows the areas available to your account.

Passwords need at least 12 characters. If you do not know your password, contact an administrator; this app does not provide a public email-based password reset screen. After repeated incorrect attempts, follow the displayed waiting period rather than continuing to guess. Sessions expire after eight hours; sign in again when asked.

## 2.2 Change your password and sign out

Select your name in the top bar to open **My account**. Enter **Current password**, **New password** and **Confirm new password**, then choose **Change password and sign out**. Use a different password with at least 12 characters. All existing sessions end, including other devices. Sign in again with the new password.

Use **Sign out** in the top bar when finished. If a connection error says sign-out failed, retry when connected; do not assume the session has ended. Successfully signing out clears the app's temporary service drafts in that tab.

## 2.3 Find a page

The left navigation has collapsible groups: Dashboard, Tenders & commercial, Operations, Service, Finance, Sales / CRM, Management and Administration. Select a group heading to expand or collapse it. On a phone, use **Open navigation** in the top bar.

Some sidebar entries open a family of registers. For example, **Customers & manufacturers** opens Customers with buttons for contacts, interactions, pipeline, competitors, manufacturers and products. **RFQs & quotations** provides RFQs, quotation revisions, follow-ups and comparisons. Use these page buttons to reach the related registers.

This guide also gives direct page links. They still require sign-in and permission. You can bookmark an authorized page; a bookmark does not grant extra access.

## 2.4 Create and save a record

1. Open the correct register.
2. Select **Add record** or its specific equivalent, such as **New Tender**, **New RFQ** or **Register Equipment**.
3. Complete required fields marked with an asterisk. Enter optional information when you know it; unknown facts should remain blank rather than be guessed.
4. For a saved-record selection, type to search, wait for results, and select the correct entry. Typing a name alone does not create that linked record.
5. For an item list, add the necessary rows, select each actual product/order item and enter its quantity and other required details. Remove rows that are not part of this transaction.
6. Select **Save record**. Wait for the form to close and the list to refresh. If an error remains, read it and correct the form.

**Cancel** closes an unsaved form. A form or preview is not a saved business record until saving succeeds. Switching a linked source can fill other fields; review the filled customer, equipment, quantities and terms before saving.

## 2.5 View, edit and find records

Use **View** to open record details. Use **Edit** where it is available, then **Save record**. Some records deliberately have no Edit action, including invoices, receipts, registered equipment, warranties, quotation revisions, financial corrections, inventory transactions and decision/result history.

Lists normally show 20 records per page. Use the page controls at the bottom. **Search records** searches the fields supported by that register. **Filter by status** appears where applicable. **Sort** chooses Newest first or Oldest first, based on saved-record creation order rather than necessarily the transaction date.

Use **From date**, **To date** and **Filter by saved record** to narrow results. Available saved-record filters come from that register's fields. Clear the search, date, status and linked-record selections to return to the broader list. **Refresh records** reloads saved data. An empty filtered list does not prove the company has no records.

If saving reports that another person changed the record, close the form, refresh and reopen it. Reapply your intended changes to the latest version. Do not repeatedly submit an outdated form.

## 2.6 Money, dates and IDs

Enter amounts as plain numbers, for example `50000.00`, without a currency symbol or grouping commas. Money supports at most two decimal places. Enter quantities as whole units where required. Most operations and finance amounts are INR; manufacturer quotations and commercial assumptions also have an explicit currency code. The comparison screen separates currencies and does not perform exchange conversion.

The app displays dates in India format and uses Asia/Kolkata for business-day/month reporting. Date-and-time inputs use the browser's local timezone and save an instant. Keep the device timezone correct, particularly for tender/RFQ deadlines. A date-only field such as Invoice date is different from a precise deadline timestamp.

Some forms ask for a **Related record ID**, not its visible business number. With export permission, export the relevant register and copy its `id` column. A record link opened through global search also contains the ID after `?record=`. Copy the complete ID exactly. Do not substitute the invoice number or company name.

## 2.7 Export a list

Apply your filters, then choose **Export Excel** or **Export CSV**. Exports use the matching records, not only the current 20-row page. They include identification/link columns where available and allow up to 5,000 matching records; narrow the filters if the app asks. You need read permission to the source register and Edit permission for the separate **exports** action. Exported files contain company information; use your company's approved storage and sharing process.

## 2.8 Upload and retrieve private files

In a record that supports files, choose **View**, find **Private files**, then select **Upload document**. Allowed upload formats are PDF, DOCX, XLSX, PNG and JPEG, with a maximum of 4 MB per file. Wait for the upload result before closing the record.

Use **Download** to retrieve a file. PDF and image files also have **Preview**, which opens a new tab. DOCX/XLSX files should be downloaded and checked in an appropriate application. Replacing a file with the same stored name retains earlier versions; inspect the `v1`, `v2` and later labels to choose the right version. This is not a delete-and-replace system.

Files require an authorized MedOps session. An internal download link is not a public sharing link. The app does not automatically attach files to emails or send them to AI. Generated ZIP packages are bounded to 32 MB; reduce the contents if packaging exceeds the limit.

# 3. Administrator: set up an empty workspace

## 3.1 Recommended setup order

1. Verify the real administrator account and stable application URL.
2. Save the company profile.
3. Create employee accounts and permissions.
4. Add customers, manufacturers, their contacts and products.
5. Save and upload company certificates, logo and letterhead.
6. Review and approve document templates.
7. Set approval policies and service SLA rules if your company uses them.
8. Enter real current business, or import reviewed historical batches.
9. Check reminders and make the backup arrangements in chapter 16.

## 3.2 Company profile

Open [Company profile](https://medops-seven.vercel.app/company), also available through Settings or Company documents. Select **Add company profile** in an empty workspace. Enter the legal company name and business address, then GSTIN, PAN, contact details, authorized signatory, designation and actual standard declarations. Use **Additional company fields** for approved name/value details needed in templates. Set **Default reminder lead time (days)**; the initial form value is 30.

Save one maintained company profile for your organization rather than creating competing profiles. Upload logo/letterhead through Company documents first, then edit the profile to select the corresponding files. Only files belonging to company documents can be chosen. Saved artwork is retained for use/reference; complex Word/PDF stationery is not automatically reproduced in generated layouts.

Updating the company profile clears existing generated-document review flags and reviewed tender-package flags because company information may have changed. Recheck affected drafts and packages before submission.

## 3.3 User accounts and permissions

Open Settings > **User accounts & permissions**, or [Users](https://medops-seven.vercel.app/users).

1. Select **Add record** and enter the employee's name and unique email.
2. Enter an initial password of at least 12 characters.
3. Choose **EMPLOYEE** or **ADMIN** and keep **Account active** checked for a working account.
4. For an employee, select **View** and, where needed, **Edit** for each module. Edit must also have View.
5. Save, privately provide the login details, and ask the employee to change the password.

Administrators have broad access. Do not select ADMIN simply to solve one missing permission. Editing an existing account can leave New password blank to keep it unchanged; entering a new password resets it. Saving an edited account revokes that user's existing sessions. Deactivate an account when access should end. The app prevents disabling/demoting your own administrator account and retaining no active administrator.

Some permissions represent actions rather than pages. The permission reference later in this guide explains them. You cannot rely on a visible button alone; the server checks the action and linked-record permissions when you save.

## 3.4 Customers, manufacturers and products

Open **Customers & manufacturers** in Sales / CRM.

**Customers:** Add the actual institution name, address, state, institution type and primary contact. Search first to avoid duplicates. Different hospitals may share a name; verify the address and saved ID before selecting one. Detailed departmental contacts belong in Customer contacts.

**Manufacturers:** Use the Manufacturers button. Save the manufacturer's real name and primary contact. A setup seed may already have added seven directory names, but no products, authorization or business activity should be inferred from those names.

**Products:** Use the Products button. Enter product name, model, category, manufacturer and source-backed specifications. Product and manufacturer must agree when subsequently selected on tender/order/device records. Save a separate product/model when the identity differs. Keeping saved product links improves performance attribution and consumable compatibility.

**Manufacturer contacts:** Use the corresponding button. Select the manufacturer, enter the person's name, designation, department, region, category, email, phone/WhatsApp and preferred channel. Keep Active contact checked while the contact is usable. An RFQ contact must be active and belong to the selected manufacturer.

## 3.5 Standard templates and initial checks

In Settings, select **Add standard draft templates**. This adds draft starting templates, not approved final company documents. Open **Document templates**, review wording, placeholders and signatory details, and approve only templates the company accepts. Chapter 7 explains generation and review.

Select **Check reminders now** in Settings after relevant records exist. This updates internal notifications; it is not a command to email customers. Scheduled reminders are configured for 09:00 India time daily. Empty registers and empty dashboard cards are expected before actual business data is entered.

# 4. A complete teaching example

This example ties the modules together. Read it first, then follow the detailed chapters using actual approved records or a separate training workspace.

## 4.1 Opportunity to confirmed order

1. Add fictional City Hospital, manufacturer Demo Devices and product Demo Monitor M1 in training only.
2. Create tender DEMO-T-001 with a verified deadline and two monitors. Link the customer and saved product. Upload the tender source PDF.
3. Record a Pursue decision. Add technical requirements, source specifications, bid checklist and any required security/approvals.
4. Create an RFQ from the tender, review the filled first equipment line, and request the manufacturer's real quote. Save the actual sent date when sent.
5. Record the quotation and commercial assumptions. Generate, download and review each required bid document. Build and review the tender ZIP. Confirm the bid package reviewed, then record Ready for Submission and the actual Submitted status.
6. After the real result, record Won and create official PO DEMO-PO-001 linked to that tender. Use two units at INR 50,000 each and tax 18% on that line: base INR 100,000, tax INR 18,000, total INR 118,000.
7. Save the PO unconfirmed, upload the actual official PO, reopen Edit and confirm the uploaded details. For the fictional training example use an unmistakably labelled training document only.

## 4.2 Partial fulfilment and service

1. Create the first delivery for one monitor; confirm its actual receipt date.
2. Register serial DEMO-M1-001 against that delivery and its order item.
3. Create a second delivery for the remaining monitor and register DEMO-M1-002 after confirmed receipt. Do not dispatch two units again; only one remains.
4. Record each serial's installation, commissioning and acceptance dates in order.
5. Register the warranty using the actual contract's start event and duration. For an installation-based warranty, installation must already have its confirmed date.
6. If a complaint occurs, create a ticket linked to the serial. Assign an engineer, record the visit and actual work, issue any parts through the stock ledger, and resolve/close the ticket with evidence.
7. When appropriate, create an AMC covering both devices. Schedule maintenance visits and record their actual completion. Later create a renewal linked to the predecessor contract.

## 4.3 Invoicing and corrections

Assume one invoice for the complete PO: base INR 100,000 plus tax INR 18,000. Due date is the invoice date plus the agreed number of payment days.

| Event | Adjusted charges | Effective receipts | Outstanding |
| --- | --- | --- | --- |
| Save the invoice | 118,000 | 0 | 118,000 |
| Record receipt of 40,000 | 118,000 | 40,000 | 78,000 |
| Credit base 10,000 plus tax 1,800 | 106,200 | 40,000 | 66,200 |
| Reverse 5,000 of that receipt, tax zero | 106,200 | 35,000 | 71,200 |
| Debit base 5,000 plus tax 900 | 112,100 | 35,000 | 77,100 |

The original invoice and receipt remain in history. Corrections are separate confirmed records. Each event needs a real reference, reason and date; it is not a way to force the displayed balance to a preferred number.

If comparable recorded costs are INR 70,000 excluding recoverable tax, corrected revenue excluding invoice tax is INR 95,000 and operational contribution is INR 25,000. The contribution margin is about 26.32%. This operational measure is not statutory profit.

# 5. Tenders, source review and bid controls

## 5.1 Create a manual tender

Open **Tenders & decisions** > **New Tender**. Enter a tender number, then title, bid number, source/source URL, institution text, customer where known, publication date, state, category and deadline. Add EMD/estimated value only if supported by the notice. Enter contractual warranty and delivery requirements.

Add equipment lines with equipment name and a reviewed positive whole quantity. Select a saved product/manufacturer where known; these are not automatically chosen by discovery imports. Use separate lines for separate requirements. Add item category/source references where helpful. Save as Draft or Under Review as appropriate for the work being performed.

A tender can be incomplete early in review: customer/deadline/manufacturer are not all mandatory. Do not make up an unknown quantity just to finish a form. An equipment line that is entered requires a valid quantity; unknown imported source lines can remain in the source snapshot until reviewed.

Open **View** and upload the actual notice, annexures and corrigenda in Private files. Keep the current official source under review; a saved URL or fetched title is not proof that the latest deadline has been checked.

## 5.2 GeM public metadata and selectable PDF text

The tender list has **GeM tender URL for public metadata** and **Read public metadata**. Enter an official supported GeM URL and read the response. This assists manual research; it does not create a complete tender or guarantee portal access. If retrieval fails, enter the verified information manually. Restricted pages/captchas are not bypassed.

For an uploaded tender PDF, choose **Extract text** in Private files. The app displays **Extracted selectable text - review before using**. Check amounts, units, deadlines and model names against the original document. It does not automatically apply the text to the tender. Scanned image PDFs require the separate configured Private OCR feature or manual entry.

## 5.3 Optional Tender Tracker handoff

Tender Tracker is a separate discovery app. When your operator has configured the connection, start the MedOps connection/import from Tracker, sign into your existing MedOps employee account when asked, and deliberately choose the public opportunity to hand off. You need tender-write permission. Tracker's exact button presentation belongs to that separate app.

In MedOps, open the imported tender. It begins Under Review with a Pending Review commercial decision. **Imported from Tender Tracker** shows the original source, observation dates, individual source items and retained versions. Source institution text does not automatically create/select a customer account. Source document links do not mean the document bytes were uploaded into MedOps.

To review an initial import or later corrigendum:

1. Open the original official notice and revision links.
2. Expand **Pending Review** or **Source Update Available**.
3. Compare each MedOps value with the source value.
4. Tick only the **Apply source ...** fields you accept.
5. If replacing equipment lines, choose source items, enter each **Reviewed quantity**, and explicitly tick **Replace equipment lines with my selected source items and reviewed quantities**. Review the full resulting set because this replaces the equipment-line list.
6. Choose **Accept selected source values**, or **Keep MedOps values** to retain the current business entry.
7. Recheck customer/product/manufacturer links and complete the normal commercial and document-review process.

Only the next pending source version offers review controls. Accepting source data does not mark Pursue, approve compliance, approve the bid or create an order. Repeated imports do not create duplicate tenders when the same source identity is recognized. Ambiguous matches and source changes blocked by existing orders require administrator review.

## 5.4 Go / No-Go decisions

In tender details, enter **Commercial decision reason** and notes, then select **Pursue**, **Reject** or **Review Later**. The inline reason expects an exact supported reason code, such as `PRODUCT_UNSUITABLE` or `OTHER`; use the **Go / No-Go** register for its selectable reason list. Reject asks for explicit confirmation and retains the decision.

**Pending Review** means the commercial review is unfinished. **Pursue** means an employee decided to continue. **Reject** records a No-Go. **Review Later** defers the decision. Decision history is immutable; create a new decision when circumstances change. These decisions are separate from tender stage/status and bid-package approval.

## 5.5 Technical compliance

Select **Technical compliance**. Add one row per meaningful requirement: select Tender, enter the requirement, actual manufacturer specification and evidence reference/notes. Attach the datasheet or supporting evidence through View > Private files.

The default **Requires Review** is deliberate. Select **Complies** only after checking the actual source specification; that choice requires a specification. Use **Does Not Comply** when that is the supported outcome. An explicit non-compliance decision is not approval to ignore a tender requirement. Responsible staff must resolve eligibility and portal-specific requirements.

Changing a requirement invalidates tender/document review flags. Requirements cannot move to another tender. Finish technical review before confirming a package or marking a tender Ready for Submission.

## 5.6 Bid checklist

In tender details choose **Add standard bid checklist**, then **Open bid checklist**. Review the starting items and add company/tender-specific items through **New Checklist Item**.

Each item has Tender, Section, title, status, responsible employee and notes. Sections are Commercial, Technical, Manufacturer, Company Documentation, Submission and Custom. Status choices are Pending, In Progress, Complete, Not Applicable and Blocked. Record what was actually checked. Not Applicable items are excluded from the completion denominator; a complete percentage does not prove portal compliance.

The checklist is a human work tracker. Complete it according to company procedure in addition to the app's separate source/document/technical review gates.

## 5.7 Securities / EMD / PBG

Open **Securities / EMD / PBG** > **New Security**. Choose the security type, customer, bank/reference, actual amount, linked tender/order where relevant, issue/validity/claim-expiry dates, expected refund date and responsible employee. A planned security can start Planned; update status to reflect actual issuance/submission/activity.

Track refund requests as Refund Requested or Refund Pending. When the refund actually arrives, enter **Actual refund date** and choose Refunded. This needs the **security-refund** action permission. A refund date without Refunded status is rejected. Use Released, Invoked, Expired or Cancelled only when that outcome is supported.

Dates must be consistent: relevant dates cannot precede issue; claim expiry cannot precede validity. Issued identity/amount becomes protected history, and closed securities cannot be reopened casually. Upload the real deposit/guarantee/refund evidence. Summary chips show saved blocked-amount/status totals; the register does not move bank funds.

## 5.8 Approvals and approval policies

Use **Approvals** for tracked human decisions on a particular source-record version. This is separate from **Confirm bid package reviewed**.

1. Choose **New Approval**, enter a clear title, Workflow, exact Related module key and Related record ID, then select the authorized approver.
2. Save with status Created first.
3. Reopen Edit and change status to Submitted when the source information is ready.
4. The assigned approver reviews the source record, opens the request, enters decision Comments and chooses Approved, Rejected or Changes Requested.
5. Save and inspect the retained events/status.

The assigned approver must have the configured role, approval-decision permission and source-record access. Self-approval is normally prevented. Submitted approvers/relationships are protected. If the source changes after submission, create a new approval for the new version. Approved/Rejected decisions are immutable. A Changes Requested request can be revised/resubmitted by its creator or an administrator.

Administrators configure **Approval policies** by Workflow, Prevent self-approval and Approver role. The exact accepted related modules are listed in the permission appendix. Policy settings do not secretly replace every business gate: follow company requirements and the app's separate tender review/financial validation rules.

## 5.9 Submission, outcome and win/loss history

The working tender statuses are Draft, Under Review, Documents In Progress, Ready for Submission, Submitted, Won, Lost and Cancelled. A useful working sequence is Draft > Under Review > Documents In Progress > Ready for Submission > Submitted > actual outcome. This describes usage; it does not mean every status is automatically advanced.

Before Ready for Submission or Submitted, review all generated drafts, resolve every Requires Review technical row, attach source documents and confirm the bid package reviewed. Chapter 7 gives the exact order. Submitting also needs the **tender-submit** action permission. MedOps does not submit the bid to GeM or another procurement portal. Complete the actual portal submission yourself and retain its acknowledgement.

Use **Win / Loss** to add a Tender win/loss result: select Tender, Outcome, actual Result date, supported reason and any known winner/competitor/price. Leave unknown winning prices blank. Results are retained history and require Pricing access. Saving a result also updates the tender status to Won, Lost or Cancelled; No Bid maps to Cancelled. Check that saved result/status before using a won tender for a PO. Once linked to an order, a tender cannot be rewritten through normal editing, and a non-Won result is blocked.

# 6. RFQs, quotations and commercial comparison

## 6.1 Create an RFQ

Use **Create RFQ from tender** in tender details, **Create RFQ for customer** in customer details, or **New RFQ** on the RFQs register.

Enter a unique RFQ number, manufacturer and active contact. Select the saved product where appropriate; review equipment/product name, model, quantity, accessories, warranty requirement, delivery location/time, tender deadline and **Quote required by**. Assign an active employee. A normal new RFQ starts Draft.

Tender prefill uses the first equipment line. For a multi-item tender, explicitly review the scope and create the needed RFQs rather than assuming every line was copied. Changing the selected tender/product can fill values; check them before saving.

## 6.2 Prepare, send, follow up and close

1. Review the Draft and move it to Ready to Send.
2. If needed choose **Generate RFQ letter**, select the RFQ as the generator source, download and review it.
3. Send through the deliberate communication workflow or your approved external process.
4. Record the **Actual sent date** and change to Sent. Sent/Awaiting Response require that real timestamp. Changing status is not itself an email send.
5. Move to Awaiting Response as appropriate and record follow-ups.
6. Record quotations and move to Quote Received. For further negotiation use Revision Requested, then Quote Received or Final Quote Received.
7. Close when finished, or Cancelled when appropriate. Closed/Cancelled RFQs cannot transition back to an active stage.

The complete allowed-transition table is in the appendix. Do not skip straight from Draft to Sent. **Duplicate RFQ** starts a new Draft with a blank number and cleared sent/history dates; review the copied information and enter a new number.

After a quotation is recorded, the RFQ's manufacturer/customer/tender/product relationships are locked. A different procurement scope should be represented by a separate RFQ rather than reassigned quotation history.

## 6.3 RFQ follow-ups

Choose **Record follow-up** or the Follow-ups button. Select RFQ and employee, enter Contact date/time, actual notes and Next follow-up. The next follow-up cannot precede contact. An entry records work; it does not place a call or send a reminder to the manufacturer automatically.

## 6.4 Manufacturer quotations and revisions

From an RFQ choose **Add manufacturer quote**, or open **Quotations & revisions** > **Add Manufacturer Quote**.

Select manufacturer and optional RFQ/tender/product links. Enter the actual quotation number/date, validity, currency, product/model, quantity, unit price, tax amount and quoted cost components: accessories, freight, installation, warranty, extended warranty and other costs, plus discount. Enter delivery lead time, payment terms and warranty text. Mark **Final quotation** only when appropriate. Upload the original quotation after saving.

The app calculates a component total. **Actual quoted final price** separately records the manufacturer's stated final price; linked commercial assumptions prefer that value when it is entered, otherwise they use the calculated total. Check both against the original and document a difference. Do not count an inclusive final price and its components twice when planning costs. Validity cannot precede the quotation date and discount cannot exceed the quote value.

For a normal RFQ-linked quote, record the RFQ as sent first; receipt cannot be recorded while it is Draft or Ready to Send. Saving the quotation updates its linked RFQ to Quote Received, or Final Quote Received when Final quotation is checked, and records receipt timing. Check the resulting RFQ status.

Saved quotations cannot be overwritten. Open the latest revision and choose **Add quotation revision**. Retain Previous revision, change actual revised terms/date and save. Only the latest version can be revised; series identity/manufacturer/linked scope must remain consistent. A different quote scope belongs in a separate series. Comparisons retain the exact revision selected, so review old assumptions after a new quote arrives.

## 6.5 Commercial assumptions and comparison

Open **Commercial assumptions** > **New Comparison**. Enter an option name, tender/RFQ links, quotation revision and currency. Leave Procurement cost blank to use the linked quote, or enter a supported explicit cost. Add Additional commercial costs and Proposed selling price **for the complete option**, not per-unit unless the entire option is one unit. Record lead time and assumptions in Notes.

Calculated values are:

- Total cost = procurement cost + additional commercial costs.
- Contribution = proposed selling price - total cost.
- Margin % = contribution / proposed selling price x 100, where selling price supports a meaningful denominator.

Open **Compare options** / **Commercial comparison**. Filter by tender or RFQ. Options are grouped by currency. Lowest cost, highest margin and shortest lead-time chips describe entered data; they do not recommend a winner, verify technical compliance or convert currencies. The screen shows up to the latest 100 options; narrow filters if more exist. Export detailed assumptions from their register.

## 6.6 Email, manual email, WhatsApp and email history

Open **Email & WhatsApp**. Choose Related module (RFQs, Invoices, AMCs, Tickets or Tenders), enter the exact record ID, recipient, subject and reviewed message text. For WhatsApp enter a phone number with country code, using digits or a leading plus without spaces.

**Configured provider email:** review the recipient/text, tick **I reviewed this recipient and text and want to send this email**, then select **Send email**. A provider must be configured and the sender verified by your operator. No files are attached automatically. Successful provider confirmation is recorded; it is not proof that the recipient read the message. Inspect **Email history** for status and related-record context.

**Manual email:** **Open manual email** opens your email application with the recipient/subject/body. Review and send there. Merely opening the draft does not send it, and the external email client's send is not automatically a MedOps provider-history event.

**WhatsApp:** **Share via WhatsApp** opens WhatsApp with the text. Check the intended chat and explicitly send there. It is not an automatic message dispatch.

If a provider attempt times out or reports an uncertain status, check Email history and ask the operator to check provider history before resending. An unchanged retry in the same form retains its request identity and needs renewed confirmation. Editing recipient/text or reloading can start a new request; do not use this to bypass an uncertain-send warning. Editing clears consent. Record any RFQ sent date/follow-up separately after the real send.

# 7. Company documents, templates and generation

## 7.1 Company documents library

Open **Company documents** > **Add record**. Give the document a clear name and select its category: GST certificate, PAN, registration, manufacturer authorization, past performance, product datasheet, declaration, logo, letterhead or Other. Enter real issue/expiry dates, manufacturer where applicable, notes and Active status. Save, choose View and upload the actual file.

Expiry must not precede issue date. Review expiring authorizations/certificates before using them in a bid. Keep inactive/outdated metadata clear, while retained file versions preserve history. Document-library entries do not automatically prove that a portal-specific certificate or authorization is valid.

## 7.2 Document templates

Open **Document templates**. Administrators can create or edit the template name, Document type, body and **Approved for generation**. Standard drafts can be added from Settings. Review their company details and legal/commercial wording before approval.

Templates are maintained as text containing placeholders such as `{{company_name}}` and `{{tender_number}}`. Use word/underscore placeholder names consistently. Custom placeholders become fields in the generator and must be completed. Editing a saved template increases its version; already generated files remain retained drafts.

Types include RFQ letter, covering letter, non-blacklisting, warranty undertaking, authorization request, compliance statement/comparison, checklist, delivery challan, packing list, service report, installation/commissioning report, handover, payment reminder and Custom. Select the appropriate template and source together. A template cannot issue a manufacturer's authorization or invent certificate/compliance contents.

## 7.3 Generate one document

1. Open **Document generator**.
2. Select an **Approved template**. If none are listed, ask an administrator to approve one.
3. Choose **Source record type**: RFQ, Engineer service visit, Tender, Delivery, Installation or Invoice.
4. Select the exact **Source record**.
5. Choose **Output format**: DOCX, PDF, XLSX or ZIP.
6. Select **Load saved information & preview**.
7. Read the preview and every placeholder field. Complete missing values, check amounts/names/dates, and correct draft-specific wording. A preview correction does not change the original saved source record.
8. Select **Generate reviewed information as a draft**.
9. Select **Download generated draft** and inspect the actual file, including page layout and any spreadsheet contents.
10. Open **Draft history & review**, View the corresponding generation and select **Confirm draft reviewed** only after checking it.

Changing the template/source or placeholder values clears stale preview/download state. Generate again for the new information. Required placeholders cannot remain blank; the app names them in its error. Review the generated result even if the on-screen text looked correct.

DOCX is a real Word document. Native PDF supports Latin text; use DOCX when the required language/script is not supported by PDF rendering. XLSX is the structured workbook provided by the generation workflow, not a full reproduction of Word layout. A per-template ZIP is a DOCX/PDF/compliance-workbook bundle, different from the complete tender package.

## 7.4 Draft history and complete tender ZIP

**Generated document history** retains generated files, source type, format and review information. Use View > Download draft and Confirm draft reviewed. Access also depends on the original source module. Generating is not the same as final approval or actual portal submission.

For a complete tender package:

1. Finish the saved tender details and technical requirements.
2. Upload current tender sources and compliance evidence.
3. Generate every required individual document and review each in Draft history.
4. In Document generator, select Tender and its source record.
5. Under **Complete tender package**, select the needed **Company evidence documents**.
6. Select **Build complete tender ZIP**. The package contains the latest reviewed individual drafts, source/evidence files and selected company documents; it does not generate missing individual documents automatically.
7. Download the ZIP, extract it and check actual contents against the tender's portal checklist. Review the ZIP entry in Draft history too.
8. Return to the tender View and select **Confirm bid package reviewed**.
9. Edit the tender to Ready for Submission, then record Submitted after the real submission.

The bid-review action requires source files, generated documents with review flags, and no unresolved Requires Review technical rows. Other checklist/policy obligations still need employee attention. If you change tender content, compliance or relevant attachments, recheck review flags and repeat the review sequence where invalidated. Saving tender corrections while keeping Ready/Submitted can be blocked; save them in Documents In Progress and review again.

# 8. Purchase orders, deliveries and installation

## 8.1 Purchase orders

Open **Purchase orders** > **Add record**. For a tender-linked order, select **Won tender (optional)**; only Won tenders are eligible and the customer must match. For a direct customer order, leave the tender blank and select the actual customer.

Enter Official PO number, PO date, delivery deadline, actual payment terms and notes. Review the equipment/product/manufacturer and quantity on every copied line. Enter the actual **Unit price (INR)** and **Tax %**. Tender prefill does not supply final prices or the PO delivery deadline. The app computes the total from each line's quantity, price and percentage tax.

Save without checking **Official PO uploaded and details confirmed** first. Open View > Private files and upload the official customer PO. Reopen Edit, compare all details to the document, then check the confirmation box and save. Normal confirmation requires an uploaded official source file.

Use statuses such as Order Received, Manufacturer Order Pending/Placed, Processing, Ready for Dispatch, Partially Delivered, Delivered, Completed or Cancelled to reflect actual progress. MedOps does not place an order with a manufacturer or change an external portal when these labels change.

After dispatch or invoicing, commercial identity, customer/tender, dates/terms and line values are locked; confirmed status cannot be undone. Status/notes can still be maintained where allowed. Review prices and product links before the first downstream transaction.

## 8.2 Partial dispatch and receipt confirmation

Open **Deliveries & installations** > **Dispatch & delivery** > **Add record**.

1. Select the confirmed, non-cancelled PO.
2. Enter dispatch date, transporter, tracking/reference, expected date and destination.
3. Inspect the prefilled item list. Keep only lines actually in this dispatch and enter the dispatched quantity for each. Each order item should appear once.
4. Save and upload actual dispatch/challan/proof files where needed.
5. When the customer actually receives the goods, Edit the delivery, enter Actual delivery date and check Customer delivery confirmed.
6. Save and then register the received serial numbers.

Every saved dispatch consumes the order's dispatched-quantity balance, even before receipt confirmation. The app blocks quantities above the remaining balance. Do not create duplicate dispatch records to correct a confirmation delay. Edit the existing allowed record instead.

Confirmed delivery requires its actual date, which cannot precede dispatch. A delivery cannot move to a different order. Once serials are registered, confirmation/actual date are locked and registered lines cannot be removed or reduced below serial count. After related warranty registration, delivery editing is locked.

## 8.3 Register equipment: one record per serial

Open **Installed base** > **Register Equipment**. Select Confirmed delivery, PO and correct order item, then verify customer, manufacturer, saved product, equipment name and model. Enter the device's actual unique Serial number, hospital location and department. Save one record per unit, not one record representing multiple serials.

Delivery selection initially chooses the first item; change it if this serial belongs to another line. The device must match a confirmed received unit, customer/order and delivered product/manufacturer. You cannot register more serials than the delivered quantity. Registered equipment is immutable through normal editing.

View the device to see permitted installation, warranty, AMC, service/visit and parts history. Historical devices can be registered by administrators without invented old orders; chapter 14 explains that route.

## 8.4 Installation, commissioning and acceptance

Use **Installations** under Deliveries & installations. Select the saved Equipment serial number. Save Pending/Partial while work is incomplete, then enter actual Installation, Commissioning and Customer acceptance dates as each event occurs.

Installed requires installation date. Commissioned requires installation and commissioning dates. Accepted requires all three. Dates must follow the actual delivery and each other in order; do not use an anticipated date as actual acceptance. Generate the appropriate installation/commissioning/handover report using the installation as source.

An installation cannot be moved to another device. After a warranty exists for the device, installation contract dates are locked. Complete and verify the dates before creating the warranty.

# 9. Warranty, AMC and consumable growth

## 9.1 Warranty management

Open **Warranty management** > **New Warranty**. Select the equipment, actual Warranty type, Contractual start event, duration in months and Warranty terms. Start-event choices are Delivery, Installation, Commissioning, Acceptance or Contract.

For an event-based warranty, the actual delivery/installation/commissioning/acceptance date must already exist. For Contract, enter the explicit contract start date. The app calculates the end by adding the stated months and clamps month-end anniversaries; 31 January plus one month becomes the last day of February. Verify that the displayed result matches the actual contract before relying on it.

Save, then upload the actual warranty evidence. Warranties cannot overlap for a device and cannot be overwritten. Historical original periods need the administrator's historical workflow. In View, **New warranty service note** > **Add service note to history** appends service information without changing the contractual period.

Service-ticket coverage displays current India-date coverage, including the recorded end date, and can show Active, Upcoming, Expired or inactive, or Not recorded. It is a date/status view, not a guarantee that every repair/part is covered; read the actual terms. Warranty and AMC sections are permission-filtered, and AMC amounts are omitted there.

## 9.2 AMC contracts and renewals

Open **AMC & opportunities** > **Contracts** > **New AMC**. Enter contract number, customer, actual start/end, amount, service frequency in months, initial next-service date, responsible employee/name and status. Select all Covered equipment; every device must belong to the same customer. Upload the contract through View.

End must follow start, and an entered next-service date must lie within the contract. Select Active, Expired or Cancelled based on actual contract status. These contracts do not themselves create invoices or receive payment; record finance separately where the supported invoice workflow fits the company's actual transaction.

For renewal, create a **new** AMC with the new number/dates and select **Previous AMC (renewal)**. It must follow the previous contract's end and belong to the same customer. Preserve the earlier contract rather than overwriting its dates as a renewal shortcut.

## 9.3 AMC maintenance and service visits

Select **Maintenance visits**. Add a visit linked to the AMC, assigned employee, Scheduled date, Service status, complaint and notes. The schedule must be within the contract. Use Scheduled, Complaint or Cancelled as appropriate. For Completed, enter the actual Completed date, which cannot precede the scheduled date.

Upload the retained service report. Completed/cancelled visits are immutable and cannot move to another contract. Completion computes the next service from the latest actual completed visit plus the contract frequency; an older backfilled visit does not move the schedule backwards. If the next date would exceed contract end, no further next-service date is scheduled by that calculation.

These AMC visits are separate from **Engineer service visits**, which are tied to complaint tickets and use precise start/completion timestamps. Record each in the appropriate register; one does not automatically stand in for the other.

## 9.4 AMC opportunities

Select **AMC opportunities**, then **Refresh actual contract opportunities** to derive opportunities from real saved warranty/contract dates. This does not send a customer message or invent a sales value. Existing adequate current/future coverage can retire a generated open opportunity.

Review customer/device, reason, trigger date, assignee and next follow-up. Enter an estimated value only when a person has a supported estimate. Manage statuses New, Contacted, Interested, Quote Sent, Negotiation, Won, Lost or Not Applicable as actual sales activity progresses. You can add a manually supported opportunity too. A Won opportunity does not automatically create an AMC; save the real contract separately.

## 9.5 Consumables, approved compatibility and opportunities

Open **Consumables & opportunities** > **Catalogue**. Add the real SKU, consumable name, manufacturer, Active status and notes. This catalogue is separate from the spare-parts stock ledger; adding a consumable is not a stock receipt or sale.

An administrator opens **Approved compatibility**, chooses a saved Product and Consumable, checks actual manufacturer evidence, and saves the active link. Free-text similarity is not proof of compatibility.

Open **Opportunities** to record a customer and consumable, optionally an installed device, last actual sale date/quantity, next follow-up, assignee, status and notes. The customer/device must agree; device-linked compatibility is checked against approved links. Next follow-up cannot precede last sale. Record actual progress; the app does not guess replacement intervals, automatically place sales orders or invent demand.

# 10. Service desk, engineer work and spare parts

## 10.1 Service tickets

Open **Service tickets & SLA** > **New Service Ticket**. Enter the ticket number, customer and equipment/product. Selecting Installed equipment fills identifying data; verify serial, manufacturer, model and department. You can record a complaint without a saved device, but it will not have linked-device coverage.

Enter Reported issue, Priority (Low, Normal, High or Critical), actual Reported date/time, contact details and notes. Select an engineer and scheduled visit where known, and an optional applicable SLA rule. Normal new tickets start Open, Assigned or Visit Scheduled. Assigned/Visit Scheduled/In Progress require an engineer; Visit Scheduled also requires a scheduled timestamp.

Use status to track Open > Assigned > Visit Scheduled > In Progress, with Waiting for Parts or Waiting for Manufacturer as needed. Record the actual work in engineer visits. When resolving, enter Resolution and Resolved date/time, then choose Resolved with the **ticket-resolve** permission. Resolved tickets can advance to Closed; their resolution/time/assignee cannot be rewritten. Closed/Cancelled tickets are immutable; a new issue requires a new ticket.

Ticket number, customer, linked device/serial and reported timestamp are protected after creation. Check these before saving. Assignment to another employee needs **ticket-assign**. Use View to inspect actual warranty/AMC coverage and upload relevant complaint evidence/photos. Selecting a status does not contact the customer or manufacturer.

## 10.2 Engineer service visits

Use **Engineer visits** or **Record service visit** in Engineer home. Select an open ticket and its assigned Engineer, enter Scheduled date/time and save Scheduled. A non-admin engineer records their own visits, and the engineer must match the ticket assignment.

When work starts, enter the actual Started date/time and use Started. On completion, enter Completed date/time, **Work performed**, Customer representative and Acknowledgement, plus Next visit and notes when needed. Completed visits require actual start/completion and work; acknowledgement should describe what was actually confirmed, not fabricate a signature. Upload approved photographs/reports through View.

Times must follow the report/start/completion sequence; a next visit must follow this visit. Saving a visit with an actual start also records the ticket's first-visit milestone when not already present and moves the ticket to In Progress. Completed/Cancelled visits are immutable and relationships cannot be reassigned. Generate a service report from the saved Engineer service visit when required, then review the resulting draft. Completing a visit is not automatically a final ticket-resolution decision; update the ticket separately.

## 10.3 Engineer home, phones and temporary drafts

Open **Engineer home** to see Today's visits, Overdue visits and Assigned tickets according to your access. Select a visit link to open it, **Open ticket and contracts** for the complaint/coverage, or **Record service visit** for the linked form.

This home screen focuses on your assigned work, including when an administrator opens their own home. Administrators should use the Service tickets/Engineer visits registers to inspect other employees' work; the home screen has no employee-switching control.

Ticket and engineer-visit forms offer **Save temporary draft in this tab** and **Restore temporary draft**. This saves unsent form text in the current browser tab for up to 24 hours. It is not a database save, attachment upload, shared draft or offline synchronization. Save the real record while online. Closing the tab, browser restrictions, expiry, successful save, password change or sign-out can remove the temporary draft.

The app has an installable online PWA manifest. If your browser offers Install/Add to Home Screen, you can use it as a convenient launcher. It still needs network access; it does not cache business registers for offline use.

## 10.4 SLA rules and Service SLA

An administrator opens **SLA rules**. Create a name, assignment/first-visit/resolution target in hours and Active status. Optionally limit it by customer, manufacturer, AMC or warranty type. Targets are positive whole hours. Link a suitable rule to a ticket; an AMC-specific rule must cover that device/customer.

Open **Service SLA** for open/critical/parts-waiting counts, average assignment/first-visit/resolution **minutes**, breaches and record links. Due targets are elapsed calendar hours from the reported timestamp, not a working-hours/holiday calendar; displayed averages are minutes. Assignment is timestamped when the assignment is saved, first visit comes from the recorded visit start, and resolution uses its actual recorded timestamp. Empty averages mean there are no recorded milestone observations, not a zero-minute response. Recorded late milestones can remain breaches after resolution; cancelling a ticket is not a way to claim service performance.

Use **Export SLA Excel** with the necessary permissions. SLA results depend on accurate actual timestamps and configured rules. They are a work-monitoring view, not automated customer communication.

## 10.5 Spare-parts catalogue

Open **Spare parts & stock** > **Spare parts**. Add SKU, actual part name, manufacturer, compatible-model text, reorder level, optional unit cost, storage location, supplier and Active status. Pricing permission controls cost visibility/editing. Free-text Compatible models is a description, separate from approved product/consumable compatibility.

Adding the catalogue entry does not create opening stock. Use an inventory transaction to record the real opening receipt. Keep stock movement evidence and use company-approved adjustment reasons for discrepancies.

## 10.6 Inventory transactions and balances

Open **Stock transactions** > **Add record**. Select Part, Transaction type, quantity, timestamp and notes. A unique transaction reference is supplied in the form; keep it unique for a genuinely new movement. Select Ticket/Engineer for service use, and **Consume reserved stock** only for an OUT or USED_IN_SERVICE movement that should consume an existing reservation.

| Type | Effect | Quantity to enter |
| --- | --- | --- |
| IN | Adds stock on hand. | Positive number received. |
| OUT | Removes stock on hand. | Positive number issued. |
| RESERVE | Holds available stock; on-hand count stays unchanged. | Positive number to reserve. |
| RELEASE | Removes an existing hold; on-hand stays unchanged. | Positive number released. |
| USED_IN_SERVICE | Removes stock and links actual service consumption. | Positive number used; ticket and engineer required. |
| RETURN | Adds physically returned stock. | Positive number returned. |
| ADJUSTMENT | Adds/subtracts a supported correction to on-hand. | Signed non-zero quantity, with reason and adjustment permission. |

Available stock = on hand - reserved. Example: receive 10, reserve 3, then use 2 with Consume reserved stock: on hand becomes 8, reserved becomes 1, available remains 7. Without that checkbox, an issue consumes unreserved stock and leaves the hold unchanged.

Reservation/release needs **inventory-reserve**. Issue/return/service consumption needs **inventory-issue**. Adjustment needs **inventory-adjust** and a reason. Only an administrator can explicitly confirm a negative adjustment using the confirmation box; ordinary movements cannot silently create negative stock. Reserved stock cannot exceed the valid on-hand capacity or become negative.

Saved transactions are immutable; do not overwrite a movement. Use a supported compensating transaction with a documented reason after checking the actual stock. Service use requires an open ticket and matching assigned engineer; non-admin engineers record their own consumption. Once a ticket is closed, finish any needed stock recording through the correct authorized procedure rather than reopening history informally.

# 11. Invoices, receipts, corrections and costs

## 11.1 Invoices and due dates

Open **Invoices & receivables** > **Invoices** > **Add record**. Enter Invoice number, confirmed non-cancelled PO, matching Customer, Invoice date, Invoice base amount, Tax amount and Payment terms in days. The base and tax are monetary amounts; tax here is not a percentage. Attach the actual invoice through View after saving.

The app calculates Total = base + tax and Due date = invoice date + payment-term days. A normal invoice needs the confirmed PO; its date cannot precede the PO date. Cumulative adjusted invoicing for that order cannot exceed the official order total. Enter only this invoice's amount, not the whole PO amount again for every partial invoice.

Invoices are immutable. An Original due date override is reserved for administrator historical entry, not a normal way to change payment terms. View shows corrected outstanding. Use Financial corrections for supported amount corrections rather than editing the original.

## 11.2 Payment receipts

Open **Receipts** / **Payment receipts**. Select Invoice, enter the actual Amount received, Payment date, bank/payment Reference and Method, plus notes. Save a separate entry for each partial receipt. Record received money rather than a promise to pay.

The receipt cannot exceed the corrected outstanding balance and its date cannot precede the invoice date. Receipts are immutable; use a Payment reversal for an actual reversal/correction. Do not create a negative receipt or re-enter a receipt because a list filter hid it. Before saving after a connection problem, refresh and check the invoice/receipt reference to avoid duplicates.

## 11.3 Payment follow-ups

Open **Follow-ups** under invoices. Select Invoice, active responsible employee where relevant, Contact date, Next follow-up date and actual notes. Next date must not precede contact. Use the record to note the promise, blocker or next action. It does not change receipt totals or send a customer message automatically.

## 11.4 Financial corrections

Open **Financial corrections** / **Audited financial corrections**. You need its Edit permission, **finance-adjust** and invoice Edit permission.

1. Select the affected Invoice.
2. Choose the Correction type: Invoice Credit, Invoice Debit or Payment Reversal.
3. For a reversal only, select the original Payment from that invoice. Leave Payment blank for invoice credits/debits.
4. Enter positive Base amount / reversed receipt and the separate Tax amount. A reversal's tax must be zero.
5. Enter actual Correction date, unique reference and a meaningful Reason.
6. Tick **I confirm this financial correction**, verify the direction and amounts, then save.

**Invoice Credit** reduces charges by base plus tax. **Invoice Debit** increases charges by base plus tax. **Payment Reversal** reduces effective receipts and increases outstanding by the reversed receipt amount. Originals remain retained. Use the worked example in chapter 4 to check direction.

Corrections cannot precede the original invoice/payment, exceed the original remaining receipt, create negative base/tax or overpayments, or break the linked order's invoicing cap. A credit below money already received can therefore be blocked; resolve the real transaction sequence with the finance administrator. A correction itself is immutable; a further supported correction needs a separate record. These are operational records of actual corrections, not automatic bank refunds or statutory filings.

## 11.5 Operational costs

Open **Operational costs**. Record the actual Cost description, Category, Amount and Incurred date, then Customer and relevant Manufacturer/Product/Tender/PO/Delivery/Installation/Ticket/Employee links. Set Service cost and Post-sale cost where supported by the actual purpose. Ticket-linked costs are treated as service costs by the workflow. Use notes for a source reference and allocation basis.

Categories include manufacturer purchase, freight, insurance, installation, travel, lodging, accessories, warranty support, service, spare parts, tender fees, bank charges and Other. Enter comparable actual costs, excluding recoverable tax when comparing against revenue that excludes invoice tax. The app does not infer purchases from manufacturer quotations or stock unit-cost fields. Record the real cost once; avoid counting the same expenditure under several registers/links as separate costs.

Linked customer/order/tender/product/manufacturer must agree. Incorrectly linked service or installation costs are rejected rather than assigned to another customer's profit. Maintain estimates in commercial assumptions and actual incurred costs here.

## 11.6 Operational profitability

Open **Operational profitability**. Choose From/To and optional Customer, Manufacturer, Product or Employee filter, then **Apply filters**. The current interface selects one saved-record dimension at a time. Export the needed section as Excel or CSV.

Revenue is invoice base revenue adjusted for credits/debits, excluding invoice tax. Recorded costs are the actual saved operational costs in scope. Gross contribution is revenue minus recorded costs; contribution margin divides contribution by revenue when meaningful. These figures need both invoice and cost source permissions plus the relevant Pricing/report permissions.

Grouping uses saved IDs, not just similar names. Missing/mixed product or manufacturer links can remain unallocated. Item-filtered attribution and whole-invoice totals are different levels; read the report's policy text. Missing costs can make apparent contribution too high. Date filters select the event dates of each source, while selected invoice balances use their lifetime corrections/receipts. This is not an accounting balance reconstructed as of a past cutoff date.

# 12. CRM, contacts and sales pipeline

## 12.1 Customer contacts and history

Open **Customer contacts** > **Add Contact**. Select Customer and enter the person's real name, designation, department, phone/email, preferred channel, Active status and notes. Keep contacts on the correct institution even if names/phone numbers look similar. Use the main customer's primary contact for general information and this register for multiple departmental people.

View a Customer to open its permitted history: interactions, commercial records, installed devices, service and financial context according to your access. A missing history section may be permission-related. History is bounded; use the corresponding full register and filters for a complete investigation of a large account.

## 12.2 Customer interactions

Open **Customer interactions** > **New Interaction**. Select Customer, optional active contact, Employee, Type and actual Date/time. Enter Interaction notes and Next follow-up. Types include Call, Meeting, Email, Visit, Tender, Service, Payment and Other.

If linking a related record, enter both its module key and exact internal ID. It must belong to the selected customer where that relationship applies, and you need source access. A selected contact must belong to that customer. Next follow-up cannot precede the interaction. This saves activity history; it does not place the call or send an email.

## 12.3 Sales pipeline

Open **Sales pipeline**. Add an opportunity title, type and Customer, plus Manufacturer/Product/Tender links when genuinely relevant. Types include Tender, AMC, Consumable, Replacement, New Equipment, Service and Other.

Use stages Identified, Reviewing, Qualified, Quote Requested, Quote Sent, Negotiation, Won or Lost based on human judgement. Enter a manually estimated value and probability from 0-100 only when supported; blank means unknown and is different from zero. Set Expected close, assignee and notes. Product/manufacturer and tender/customer must agree.

Won/Lost opportunities cannot be reopened through ordinary editing. Create a new opportunity for a genuinely new scope. Pipeline entries do not automatically become tenders, orders, AMC contracts or invoices; create the actual downstream record when it exists.

## 12.4 Competitors and competitor/customer history

Open **Competitors** and save the company, known brands, categories and evidence-based notes. Use **Competitor history** under Customers to link an actual competitor to a customer and category with notes. This is a maintained directory/history, not an external competitive-data feed.

Link the saved competitor in a tender Win/Loss result when supported. Record known winning prices only from actual evidence. The app does not invent or scrape confidential competitor quotes.

# 13. Daily work, search, dashboards and reports

## 13.1 Operations dashboard

Open **Operations dashboard** for permission-filtered cards and **View records** links, upcoming deadlines/pending actions, financial overview, outstanding by customer, payments expected this India calendar month, recent receipts and activity. Figures come from saved records, not sample statistics.

Follow a card or deadline link to its register. Use Reports/Invoices to investigate balances rather than changing a dashboard number directly. After saving business changes, refresh the dashboard page to reload the view. Missing financial sections can reflect access limits; an empty database legitimately has empty states.

## 13.2 Today's brief

Open **Today's brief** for actions from actual deadlines, missing decisions/checklist/compliance, quote/RFQ follow-ups, securities, dispatch/installations, urgent or parts-waiting tickets, visits, stock, renewal/consumable opportunities, unpaid invoices, interactions and tasks.

Choose Module, Employee or Priority to focus the list, then **Open record** for the underlying work. Finish/update the real record; this is not an independent task checkbox for every suggestion. The view is bounded to 500 records per source register, so use full registers for broader review. Today/visit/task business-day handling follows India time.

## 13.3 Tasks and follow-ups

Open **Tasks & follow-ups**. Enter Task title, active Assigned employee, Due date, Priority, Status and Notes. Use Open, In Progress, Done or Cancelled. Employees see tasks they created or were assigned; administrators see all. Mark Done after completion. Saving a task does not send an external message.

## 13.4 Notifications and reminders

Open **Notifications**. Use **Mark read** from the list; View offers **Open related module**, **Dismiss** and **Mark completed**. These change your notification state; they do not complete the linked delivery, invoice or service visit.

Scheduled/internal reminder checks derive notifications from actual business records and permissions. In Settings an authorized administrator can choose **Check reminders now**. Deterministic identifiers limit duplicates and obsolete reminders are retired. Clearing a notification is not a substitute for correcting its underlying overdue record.

## 13.5 Global search

Use the global search control in the top bar or **Ctrl+K** on Windows/Linux and **Cmd+K** on Mac. Search a tender, PO, customer, invoice, serial or other supported identification. Results are grouped by entity and include only authorized records. Select a result to open its record, including another record in the same register.

The result list is bounded to eight matches per entity. A broad search may not show every match; open that register and use its search/filters/pagination. Search is for finding saved records, not searching the entire external tender market or the text of every uploaded file.

## 13.6 Executive dashboard and performance analytics

Open **Executive dashboard** or **Performance analytics**. Use From/To, a saved-record Filter and its selection, then **Apply filters**. Review the visible opportunity/commercial/operations/finance/service/growth cards and source-policy text. Permissions govern which underlying results/decisions/costs appear.

Use **Rank customers by** Revenue, Outstanding amount, Installed base or Opportunity value. Review customer, manufacturer and product tables. Choose Export format and the relevant export button. Saved product/manufacturer links matter; similar model text is not automatically merged into a product's performance.

Interpret rates/amounts with their recorded scope. Opportunity value is human-entered, unknown remains unknown, and incomplete cost/history entry limits conclusions. Average payment delay excludes reversed receipts and uses actual receipt dates. Month cash metrics account for receipt reversals recorded in that month. Date filters are event-based, not historical ledger reconstruction.

## 13.7 Receivables and aging; reports and registers

Open **Reports & registers**. The page provides operations-register links and **Receivables & aging**, subject to source access. Review Total invoiced, Received, Outstanding and Overdue, then the invoice-aging buckets, customer balances and unpaid invoices to follow up.

Aging bands are Not overdue, 1-30 days, 31-60 days, 61-90 days and Over 90 days. Invoice due dates and the current India calendar date drive overdue age. Current balances include recorded credits/debits and receipt reversals. Separate customers with identical names remain separate by saved identity.

Select **Download invoice register** or open a linked operations register, apply its own filters and export. Reports require Reports and Invoices access; exports add their action permission. Large reports reject more than 10,000 source rows rather than silently claim exhaustive coverage; narrow the data scope using available registers/report filters.

## 13.8 Accounting exports

Open **Accounting exports**. Choose Customers, Orders, Invoices, Payments or Adjustments; set From/To and optional Customer where offered; then **Export CSV** or **Export Excel**.

Invoice interchange includes original and adjusted totals, effective received and outstanding. Payment interchange retains original amounts and reversal references; corrections have their own rows. Give finance both the necessary originals and corrections so they can reconcile with accounting. Filter dates select each register's event date; do not interpret a filtered invoice balance as a past as-of balance.

These are manual interchange files. Tally and Zoho Books synchronization are unavailable in the current app; clicking Export does not create/update their ledgers. Finance must review the columns, tax treatment and import mapping in the destination system. MedOps is not a statutory accounting or GST-return system.

# 14. Historical entry and controlled imports

## 14.1 Manual historical records

An administrator can tick **Historical record** where provided and enter **Original transaction date** and the actual source. Use this for genuine pre-existing business, not to bypass normal validation on new business.

Historical equipment can start without fictional old delivery/PO records, but needs its actual customer, serial and equipment identity. Any optional PO/delivery/item links must still belong to the same customer and agree. Historical warranty may retain original start/end dates. Historical standalone invoices can omit an unavailable old PO and retain the original due date. Existing financial/contract safeguards still apply.

**Record source** is provenance metadata. Labels such as Future Import or Future Accounting Sync are not working import/synchronization buttons. Use the actual supported import workflow below; set truthful sources for manual business entry.

## 14.2 Prepare a CSV or Excel file

Open **Historical imports** as an administrator. Supported registers are Customers, Manufacturers, Products, Equipment, Warranties, AMCs, Invoices, Payments and Parts. Import is limited to 100 data rows and 4 MB per upload; XLSX must contain a single sheet.

Prepare one header row with unique column names and plain values. Do not include formulas, hyperlinks or error cells. Dates use valid `YYYY-MM-DD`; timestamp values use ISO format with `Z` or an explicit timezone offset. Use plain monetary numbers and actual existing IDs for relations, not company names. Use `true`/`false` for booleans. For a multi-selection field such as AMC Covered equipment, place IDs in one cell separated by semicolons, for example `equipment-id-1;equipment-id-2`.

Import parent records first: customers/manufacturers, then products/parts, then devices, then warranty/AMC, and invoices before receipts. Each batch validates against existing saved records, not new rows promised by another batch. Export IDs after each parent batch. An exported register is an identification source, not automatically a complete import template; add/map the required fields and original dates shown in the import screen.

## 14.3 Validate, confirm and review results

1. Select **Register**.
2. Choose **Upload CSV / Excel**.
3. Map each app field to its source column. **Use default / blank** is suitable only when the field truly has an acceptable default or is optional.
4. Select **Validate and preview**. Read every Valid/Rejected row and inspect the mapped payload, including original dates and IDs.
5. Correct your file/mapping and validate again if needed. Preview validation rolls back its trial writes; it has not imported the business records yet.
6. Tick **I reviewed the mapped values, original dates and rejected rows; import valid rows** only after checking.
7. Select **Confirm import**. The app revalidates and imports accepted rows; it can report partial success with rejected rows.
8. Use **Refresh saved report** to inspect imported/rejected counts and per-row IDs/errors. Check the destination register and retain the report for reconciliation.

Do not treat partial success as complete success or upload the whole file again blindly. Correct rejected rows in a separately reviewed batch. Duplicate detection can reject matching customer/payment/identity records. Repeating a confirmed batch returns its saved report; a stopped processing run can resume after its processing lease expires while the preview remains valid. Previews expire after 24 hours; revalidate rather than reusing an expired review. Completed import reports are retained.

# 15. Optional text assistance and extraction

## 15.1 Private OCR

Open **Private OCR**. Read its availability message first. It requires an operator-configured, approved private HTTPS worker; selectable-PDF tender extraction remains separate and manual entry always works.

1. Upload the actual document to its normal authorized record first.
2. Select **Document register**: company documents, tenders, orders, invoices, tickets, engineer visits, warranties or AMCs.
3. Choose **Uploaded document** and verify the file version.
4. Tick **Process only this file with my private OCR worker; I will verify the extracted text**.
5. Select **Extract text** when available.
6. Compare **Unverified extracted text** against the original. Manually copy only verified values into the proper form and save normally.

OCR requires OCR Edit and source-document-module Edit permissions. The reference worker supports PDF/images, a maximum of 20 PDF pages per request and the normal 4 MB upload bound. It uses private Tesseract/Poppler infrastructure, not AI. No business record is automatically changed. If unavailable, ask the operator for configuration or enter the information manually; this guide does not claim the worker is currently deployed.

## 15.2 AI writing assistant

Open **AI writing assistant**. The app must have a configured private provider key/model, administrator enablement, remaining allowance and your AI request permission. Core operations work without it.

1. Choose Draft a letter, Create a checklist, Improve wording or Explain text.
2. Enter only the exact text you intend to share, up to 8,000 characters.
3. Read the provider/privacy warning on the screen.
4. Tick approval to send that text to OpenRouter and its provider. If the configured provider logs data, also complete the displayed non-confidential confirmation.
5. Select the request button and wait for the result.
6. Review **Draft - review before use** and use **Copy draft** if needed. Check facts and wording before manually using it elsewhere.

Only entered/pasted text is sent. Saved company records/documents are not attached automatically, but pasting their contents would still share the pasted text. AI cannot save business records, choose a bid winner, send messages or establish compliance. Editing purpose/text and each completed attempt clear approval. Prompts/answers are not retained as a chat history; copy an approved draft yourself if required.

Default privacy routing requires eligible zero-retention/no-collection providers. A specifically approved free NVIDIA exception can show a logging warning; use only non-confidential text in that mode and do not paste company documents, personal/customer information, passwords or pricing. Provider limits, credits or errors may make AI unavailable. Narrow an output-limit request instead of assuming a truncated draft is complete. Do not use AI to calculate receivables; the app's deterministic finance records do that.

## 15.3 Administrator settings for optional services

In Settings > **AI Features**, an administrator can set OpenRouter model ID, Daily requests per employee (1-100), Maximum output tokens (100-4,000) and Enable employee AI requests, then **Save AI settings**. The private API key belongs in hosting configuration, not this browser form. A configured key alone does not enable AI.

Email credentials/verified sender, private OCR worker credentials and Tender Tracker integration secrets are also managed by the operator outside employee forms. Settings exposes configured status and sanitized integration health rather than secrets. Do not paste keys/passwords into Notes, AI, chat, templates or imports.

# 16. Administrator and operator routine

## 16.1 Daily / weekly use

**At the start of the day:** check Today's brief, assigned tasks, deadline reminders, critical tickets, overdue visits and unpaid invoices. Open the real records to act. Check new source revisions before working on imported tenders.

**During operations:** save real dispatch/receipt milestones, serials, visits, costs and actual receipts promptly. Review any document before using it externally. Keep status changes separate from actual sends/submissions.

**At the end of the day:** confirm completed work and future follow-up dates, investigate failed imports/sends, check outstanding balances, and sign out. Do not dismiss unresolved business problems simply to empty the notification list.

**Weekly:** review tender/RFQ expiry, EMD/PBG refund/claim dates, expiring company documents, warranty/AMC opportunities, stock thresholds, pipeline/cost completeness and user access. Finance should reconcile originals and corrections with its accounting records.

## 16.2 Audit history

Open Settings > **Audit history**. Search/filter the retained sensitive actions, user, module and timestamps as available. It is read-only. Use it to investigate creation/edit/export/download/review/decision events with the corresponding record. Safe summaries do not reproduce secret values, full document contents or AI prompts.

An audit row is evidence of the recorded app action, not proof of an external customer acknowledgement, portal submission or bank transfer. Keep the actual business source evidence too.

## 16.3 Backups and recovery

The operator must back up both the PostgreSQL records and **all private file versions**. A Vercel deployment/rollback is not a backup of business data. Settings describes this responsibility; there is no employee one-click backup/restore screen.

Arrange encrypted database backups/point-in-time recovery as appropriate, independent private object backups, retention, monitoring, access and encryption-key custody. Keep matching migration/inventory/checksum records. Test recovery into isolated infrastructure, verify file checksums/counts and representative documents/balances, and approve a maintenance cutover only after a successful drill. Do not run restore commands against the live database just to test them.

The repository's `docs/BACKUP.md` gives the operator procedure. The backup export checks object size and SHA-256. Restore validates the full inventory, uploads objects and commits new file keys together after successful uploads; failed attempts can leave unreferenced recovery objects needing controlled cleanup. A local backup file alone is not independent disaster recovery.

## 16.4 Starting a new installation from zero - operator only

An employee using the existing live app does not need these steps. For a new isolated installation, use Node.js 24, PostgreSQL 18 and the project's approved deployment procedure.

1. Clone the MedOps repository and install its locked dependencies with `npm ci`.
2. Copy `.env.example` to a protected ignored environment file. Configure this installation's database/direct connection and exact APP_URL. Never reuse the production database for training/tests.
3. Run `npm run db:generate` and `npm run db:migrate` against that intended database.
4. Run `npm run admin:create` in a private terminal. Supply the real administrator email/name/password through the prompts. There is no default password; input can be visible in that private terminal, so keep it private.
5. Optionally run `npm run db:seed`; this adds manufacturer directory names only, not sample business transactions.
6. For local development use local private storage and `npm run dev`. For Vercel, use a separate production PostgreSQL resource with TLS and a **private** Blob store, server-only environment settings and the approved stable HTTPS origin.
7. Configure reminder authentication, deployment/migration controls and backups. Configure optional providers only if approved.
8. Run the documented validation and verify authorized login, protected pages, private storage and real company setup. Then follow chapter 3.

The repository's `docs/DEPLOYMENT.md`, `docs/SECURITY.md` and `docs/expansion/PRIVATE_OCR.md` contain detailed operator procedures. Never put secrets in source control or browser-public environment variables. A new code deployment does not automatically create employee accounts, configure email/OCR or establish off-site backups.

# 17. Problems, limits and safe corrections

## 17.1 Common problems

| What you see | What to check or do |
| --- | --- |
| Page/action missing | Ask the administrator to check View/Edit, the separate action permission and required source access. Use the correct register family buttons. |
| Please sign in | Session expired, password/account access changed, or you signed out. Sign in again. |
| Too many attempts | Wait the displayed 15-minute period and use the correct credentials; ask the administrator if necessary. |
| No matching records | Clear search/status/date/link filters and check pagination, permissions and the selected institution. |
| Linked choice missing | Search the saved identity, check the correct customer/manufacturer and active state, then create the parent record if it truly does not exist. |
| Another person changed the record | Close, refresh, reopen and reapply changes to the current version. |
| RFQ cannot move between these statuses | Follow the allowed transition table. Sent needs an actual sent timestamp. |
| PO cannot be confirmed | Save first, upload the actual official PO source, then Edit and confirm. |
| Dispatch exceeds balance | Check earlier saved dispatches and the order line; unconfirmed dispatches still consume balance. |
| All units already have serials | Search existing serial registrations for that delivery/item. Do not duplicate equipment. |
| Warranty start event missing | Confirm the actual delivery/installation/commissioning/acceptance date first, or use a supported explicit contract date. |
| Order/delivery/installation locked | Downstream history depends on it. Do not bypass it; ask the administrator to assess a supported correction/new contractual record. |
| Invoice exceeds PO / overpayment | Check adjusted previous invoices and effective receipts. Enter only the actual remaining supported amount. |
| Financial correction blocked | Verify type, source payment, date, tax, confirmation and resulting charge/receipt/order caps. |
| Insufficient available/reserved stock | Check actual on-hand and holds, release the correct hold or receive the actual stock; do not invent an adjustment. |
| Template list empty | Administrator must create/review/approve templates; also verify template access. |
| Complete these fields | Fill every named placeholder and generate again. |
| Bid package cannot be reviewed/marked ready | Attach sources, resolve Requires Review technical rows, review every generated draft and package, then confirm bid review. |
| Upload rejected | Check allowed type, actual file content and 4 MB size. Renaming an unsupported file is not conversion. |
| Extraction empty or inaccurate | Verify the original. Use configured private OCR for scans or enter manually. |
| Email disabled / uncertain send | Configure the approved provider or use manual communication. Check provider history before retrying uncertainty. |
| AI unavailable | Check admin enablement, configured model/key, permissions, allowance and provider eligibility/credits. Use manual workflows meanwhile. |
| Import partially successful | Inspect saved row results; separately correct rejected rows. Do not blindly repeat successful rows. |
| Report/export too large | Narrow dates, register filters or selected scope; limits are deliberate. |
| Sign-out failed | Restore the connection and retry; the session may still be active. |

## 17.2 What you must not assume

Saving a status does not send a message, submit a tender, place a manufacturer order, move stock physically, receive bank money, sign a service report or update Tally/Zoho. Record those actual events after performing/confirming them through the appropriate real process.

There is no generic permanent-delete workflow for rewriting history. Use Active flags, cancellation or new retained revisions/corrections where supported. Original invoices, receipts, serials, warranty periods, stock transactions, quote revisions and decision histories are intentionally protected. Contact the administrator for a genuine incorrect identity/history problem; do not create contradictory duplicates as a workaround.

Saved lookups may expose only identification, while pricing/terms/history sections need additional permissions. Missing/blank/Not recorded is different from confirmed zero or no risk. Reports use recorded data and bounded queries, not complete external market/accounting information.

## 17.3 Where to get help

Give the administrator the page name, business reference, time of the problem, exact displayed error and the action you attempted. Use the internal ID when necessary. Do not include passwords, API keys or unrestricted company documents in a public support message. For a suspected duplicate send/payment/dispatch, check saved/provider history before retrying.

# 18. Permissions and workflow reference

## 18.1 Permission combinations

View permits reading a module; Edit permits supported changes and must also include View. An ADMIN has broad authority. The following combinations are especially relevant to employees; an administrator should grant only what the person's actual duties require.

| Work | Additional permissions beyond the main register |
| --- | --- |
| Submit a tender | `tender-submit` Edit. |
| View/edit quotes, comparisons, results or cost/performance areas | Matching `pricing` View/Edit as applicable, plus source permissions for the data involved. |
| Assign another engineer | `ticket-assign` Edit. |
| Resolve/close a ticket | `ticket-resolve` Edit. |
| Reserve/release stock | `inventory-reserve` Edit. |
| Issue/return/use stock | `inventory-issue` Edit. |
| Adjust stock | `inventory-adjust` Edit; negative-adjustment confirmation is administrator-only. |
| Mark a security refunded | `security-refund` Edit. |
| Decide an approval | `approval-decide` Edit, assigned approver identity, policy role and linked-source access. |
| Financial corrections | `adjustments` Edit, `finance-adjust` Edit and `invoices` Edit. |
| Export records | `exports` Edit plus authorized source access; accounting/SLA/management pages also need their own access. |
| Generate/review files | `generated` permission plus appropriate source/template access; tender review needs tender Edit. |
| Receivables reports | `reports` and `invoices` View. |
| Profitability | Relevant report/Pricing access plus invoice and cost source access. |
| OCR a document | `ocr` Edit and source-document-module Edit. |
| AI requests | `ai` Edit plus configured/enabled service and per-request consent. |
| Historical entry/imports | Administrator authority and supported register permissions; imports also require import access. |

Approval policies, SLA rules, product/consumable compatibility, user administration and template approval have administrator restrictions even if an employee permission row is selected. Employee tasks and service work also have ownership/assignment checks.

## 18.2 Approval workflow: accepted related module keys

| Workflow | Related module keys |
| --- | --- |
| TENDER_PURSUE | `tenders`, `decisions` |
| FINAL_BID_PRICE | `comparisons`, `tenders` |
| RFQ | `rfqs` |
| QUOTE_SELECTION | `quotes`, `comparisons` |
| PO_ACCEPTANCE | `orders` |
| LARGE_DISCOUNT | `orders`, `comparisons` |
| PAYMENT_ADJUSTMENT | `invoices`, `payments` |
| CREDIT_TERMS | `customers`, `orders` |
| AMC_QUOTATION | `amcs` |
| TENDER_CANCELLATION | `tenders` |
| INVENTORY_ADJUSTMENT | `parts` |

Use the exact internal source ID. A request records approval against a source version; it is not an automatic execution of that workflow's financial/stock action.

## 18.3 RFQ transitions

| Current status | Allowed next statuses |
| --- | --- |
| DRAFT | READY_TO_SEND, CANCELLED |
| READY_TO_SEND | DRAFT, SENT, CANCELLED |
| SENT | AWAITING_RESPONSE, QUOTE_RECEIVED, CANCELLED |
| AWAITING_RESPONSE | QUOTE_RECEIVED, CANCELLED |
| QUOTE_RECEIVED | REVISION_REQUESTED, FINAL_QUOTE_RECEIVED, CLOSED, CANCELLED |
| REVISION_REQUESTED | QUOTE_RECEIVED, FINAL_QUOTE_RECEIVED, CANCELLED |
| FINAL_QUOTE_RECEIVED | REVISION_REQUESTED, CLOSED, CANCELLED |
| CLOSED / CANCELLED | No new status transition. |

Keeping the same status is allowed where the other edited fields remain valid. Quote entry and RFQ status are separate records of actual progress; inspect the current RFQ after recording a quotation rather than assuming every label changed automatically.

## 18.4 Record integrity checklist

Before saving, verify the customer identity, linked parent, product/manufacturer, quantity or amount, actual date/time, source reference and status. Before confirming an immutable milestone, read the actual document. Before sending, verify the recipient and exact text. Before reporting, check filters, permissions, date policy, missing links and recorded costs.

## Documentation basis

This guide was checked against the released app's navigation, all 51 register configurations, dedicated screen components, business validation, permissions and operator guides at commit `2c268d8`. Field choices are reproduced in Appendix B from the same checked configuration. The preceding audit used isolated local business tests; this manual does not assert that optional live providers, company-specific legal templates or an off-site disaster-recovery exercise have been accepted.

# Appendix A. Every page at a glance

All links use the live application and require the appropriate login/access. Register keys are useful for imports, approval links and related-record forms.

## Dedicated screens

| Page | Open | What you do there |
| --- | --- | --- |
| Sign in | [/login](https://medops-seven.vercel.app/login) | Enter an existing account email/password. |
| Operations dashboard | [/dashboard](https://medops-seven.vercel.app/dashboard) | Read saved operations, deadlines and finance overview. |
| Today’s brief | [/brief](https://medops-seven.vercel.app/brief) | Open real pending actions with module/employee/priority filters. |
| Executive dashboard | [/executive](https://medops-seven.vercel.app/executive) | Review management cards and source-derived performance. |
| Performance analytics | [/analytics](https://medops-seven.vercel.app/analytics) | Compare customer, manufacturer and product performance. |
| Operational profitability | [/profitability](https://medops-seven.vercel.app/profitability) | Review adjusted base revenue and actual operational costs. |
| Reports & registers | [/reports](https://medops-seven.vercel.app/reports) | Open operational registers and receivables/aging. |
| Document generator | [/generator](https://medops-seven.vercel.app/generator) | Preview and generate files; build a complete tender package. |
| Commercial comparison | [/comparison](https://medops-seven.vercel.app/comparison) | Compare saved options by currency/tender/RFQ. |
| Email & WhatsApp | [/communication](https://medops-seven.vercel.app/communication) | Deliberately send or open reviewed messages. |
| Accounting exports | [/accounting](https://medops-seven.vercel.app/accounting) | Export manual accounting interchange files. |
| Historical imports | [/imports](https://medops-seven.vercel.app/imports) | Map, validate, confirm and reconcile historical imports. |
| Private OCR | [/ocr](https://medops-seven.vercel.app/ocr) | Explicitly extract a selected file with a configured private worker. |
| AI writing assistant | [/ai](https://medops-seven.vercel.app/ai) | Explicitly request help with entered text. |
| Settings | [/settings](https://medops-seven.vercel.app/settings) | Configure company/access links, templates, reminders and AI controls. |
| Engineer home | [/engineer](https://medops-seven.vercel.app/engineer) | Open assigned tickets and today/overdue engineer visits. |
| Service SLA | [/service-sla](https://medops-seven.vercel.app/service-sla) | Inspect recorded service metrics/breaches and export. |
| My account | [/account](https://medops-seven.vercel.app/account) | Change your password and revoke all sessions. |

## All 51 registers

| Register | Key / direct page | Typical action |
| --- | --- | --- |
| AMC management | [/amcs](https://medops-seven.vercel.app/amcs) | New AMC |
| AMC opportunities | [/amc-opportunities](https://medops-seven.vercel.app/amc-opportunities) | New AMC Opportunity |
| Approval policies | [/approval-policies](https://medops-seven.vercel.app/approval-policies) | Add record |
| Approvals | [/approvals](https://medops-seven.vercel.app/approvals) | New Approval |
| Audit history | [/audit](https://medops-seven.vercel.app/audit) | View retained history |
| Audited financial corrections | [/adjustments](https://medops-seven.vercel.app/adjustments) | New Financial Correction |
| Bid submission checklist | [/checklist](https://medops-seven.vercel.app/checklist) | New Checklist Item |
| Commercial assumptions | [/comparisons](https://medops-seven.vercel.app/comparisons) | New Comparison |
| Company documents | [/documents](https://medops-seven.vercel.app/documents) | Add record |
| Company profile | [/company](https://medops-seven.vercel.app/company) | Add company profile / Edit |
| Competitor / customer history | [/competitor-customers](https://medops-seven.vercel.app/competitor-customers) | Add record |
| Competitors | [/competitors](https://medops-seven.vercel.app/competitors) | New Competitor |
| Consumable opportunities | [/consumable-opportunities](https://medops-seven.vercel.app/consumable-opportunities) | New Consumable Opportunity |
| Consumables catalogue | [/consumables](https://medops-seven.vercel.app/consumables) | New Consumable |
| Customer contacts | [/customer-contacts](https://medops-seven.vercel.app/customer-contacts) | Add Contact |
| Customer interactions | [/interactions](https://medops-seven.vercel.app/interactions) | New Interaction |
| Customers | [/customers](https://medops-seven.vercel.app/customers) | Add record |
| Deliveries & dispatch | [/deliveries](https://medops-seven.vercel.app/deliveries) | Add record |
| Document templates | [/templates](https://medops-seven.vercel.app/templates) | Add record |
| Email history | [/mail](https://medops-seven.vercel.app/mail) | View retained history |
| Engineer service visits | [/ticket-visits](https://medops-seven.vercel.app/ticket-visits) | New Service Visit |
| Generated document history | [/generated](https://medops-seven.vercel.app/generated) | View retained history |
| Installations | [/installations](https://medops-seven.vercel.app/installations) | Add record |
| Installed base | [/equipment](https://medops-seven.vercel.app/equipment) | Register Equipment |
| Inventory transactions | [/inventory](https://medops-seven.vercel.app/inventory) | New Stock Transaction |
| Invoices & receivables | [/invoices](https://medops-seven.vercel.app/invoices) | Add record |
| Maintenance & service visits | [/visits](https://medops-seven.vercel.app/visits) | Add record |
| Manufacturer contacts | [/manufacturer-contacts](https://medops-seven.vercel.app/manufacturer-contacts) | Add record |
| Manufacturer quotations | [/quotes](https://medops-seven.vercel.app/quotes) | Add Manufacturer Quote |
| Manufacturers | [/manufacturers](https://medops-seven.vercel.app/manufacturers) | Add record |
| Notifications | [/notifications](https://medops-seven.vercel.app/notifications) | View retained history |
| Operational costs | [/costs](https://medops-seven.vercel.app/costs) | New Cost |
| Payment follow-ups | [/followups](https://medops-seven.vercel.app/followups) | Add record |
| Payment receipts | [/payments](https://medops-seven.vercel.app/payments) | Add record |
| Product / consumable compatibility | [/compatibility](https://medops-seven.vercel.app/compatibility) | New Compatibility |
| Products | [/products](https://medops-seven.vercel.app/products) | Add record |
| Purchase orders | [/orders](https://medops-seven.vercel.app/orders) | Add record |
| RFQ follow-ups | [/rfq-followups](https://medops-seven.vercel.app/rfq-followups) | Add record |
| RFQs | [/rfqs](https://medops-seven.vercel.app/rfqs) | New RFQ |
| Sales pipeline | [/pipeline](https://medops-seven.vercel.app/pipeline) | New Sales Opportunity |
| Securities / EMD / PBG | [/securities](https://medops-seven.vercel.app/securities) | New Security |
| Service SLA rules | [/sla-rules](https://medops-seven.vercel.app/sla-rules) | Add record |
| Service tickets | [/tickets](https://medops-seven.vercel.app/tickets) | New Service Ticket |
| Spare parts | [/parts](https://medops-seven.vercel.app/parts) | New Spare Part |
| Tasks & follow-ups | [/tasks](https://medops-seven.vercel.app/tasks) | Add record |
| Technical compliance | [/requirements](https://medops-seven.vercel.app/requirements) | Add record |
| Tender decisions | [/decisions](https://medops-seven.vercel.app/decisions) | Add record |
| Tender win/loss results | [/results](https://medops-seven.vercel.app/results) | Add record |
| Tenders | [/tenders](https://medops-seven.vercel.app/tenders) | New Tender |
| User accounts & permissions | [/users](https://medops-seven.vercel.app/users) | Add record |
| Warranty management | [/warranties](https://medops-seven.vercel.app/warranties) | New Warranty |

# Appendix B. Complete field reference

This is the form inventory for all 51 registers and their 492 top-level fields. **Required** follows the form configuration; additional conditional rules described in the chapters still apply. A default is a starting value, not evidence that the underlying business event occurred. Internal field keys help when mapping imports; employees normally use the visible label.

For every editable register, use chapter 2’s create/save/search procedure and the workflow chapter for its business rules. Fields marked optional can become required by the selected status or normal/historical workflow. This appendix lists choices, not permission to bypass those rules.


## B01. Tender decisions

Open [/decisions](https://medops-seven.vercel.app/decisions). Human Go / No-Go decisions with immutable history. Reject requires confirmation.

History rule: create a retained record; there is no normal overwrite/Edit workflow. Use the documented revision/correction/note process where available.

| Field (internal key) | Required | How to enter / available choices |
| --- | --- | --- |
| **Tender** (`tenderId`) | Yes | Search and select a saved record from Tenders. |
| **Commercial decision** (`decision`) | Yes | Choose: PENDING_REVIEW, PURSUE, REJECT, REVIEW_LATER. |
| **Decision reason** (`reason`) | No | Choose: PRODUCT_UNSUITABLE, PRICE_UNCOMPETITIVE, MANUFACTURER_UNAVAILABLE, AUTHORIZATION_UNAVAILABLE, DELIVERY_UNSUITABLE, LOW_VIABILITY, COMPETITOR_ADVANTAGE, INSUFFICIENT_TIME, STRATEGIC_REJECTION, OTHER. |
| **Notes** (`notes`) | No | Enter the actual detailed text or notes. |
| **I confirm this rejection** (`confirmed`) | No | Tick Yes when true; leave unticked for No. |

## B02. Manufacturer contacts

Open [/manufacturer-contacts](https://medops-seven.vercel.app/manufacturer-contacts). Multiple contacts, regions and preferred communication channels.

History rule: Edit is available with permission, subject to the status, parent-link and downstream locks described in the workflow chapters.

| Field (internal key) | Required | How to enter / available choices |
| --- | --- | --- |
| **Manufacturer** (`manufacturerId`) | Yes | Search and select a saved record from Manufacturers. |
| **Contact name** (`name`) | Yes | Type the actual text. |
| **Designation** (`designation`) | No | Type the actual text. |
| **Department** (`department`) | No | Type the actual text. |
| **Email** (`email`) | No | Enter a valid email address. |
| **Phone** (`phone`) | No | Type the actual text. |
| **WhatsApp number** (`whatsapp`) | No | Type the actual text. |
| **Region** (`region`) | No | Type the actual text. |
| **Product category** (`category`) | No | Type the actual text. |
| **Preferred channel** (`preferredChannel`) | Yes | Choose: EMAIL, PHONE, WHATSAPP, OTHER. Starting default: EMAIL. |
| **Active contact** (`active`) | No | Tick Yes when true; leave unticked for No. Starting default: Yes. |
| **Notes** (`notes`) | No | Enter the actual detailed text or notes. |

## B03. RFQs

Open [/rfqs](https://medops-seven.vercel.app/rfqs). Create directly or prefill from a tender/customer. Sending and follow-ups are recorded explicitly.

History rule: Edit is available with permission, subject to the status, parent-link and downstream locks described in the workflow chapters.

Files: after saving, use View > Private files for upload/download/available preview.

| Field (internal key) | Required | How to enter / available choices |
| --- | --- | --- |
| **RFQ number** (`number`) | Yes | Type the actual text. |
| **Tender (optional)** (`tenderId`) | No | Search and select a saved record from Tenders. |
| **Customer (optional)** (`customerId`) | No | Search and select a saved record from Customers. |
| **Manufacturer** (`manufacturerId`) | Yes | Search and select a saved record from Manufacturers. |
| **Manufacturer contact** (`contactId`) | No | Search and select a saved record from Manufacturer contacts. |
| **Saved product** (`productId`) | No | Search and select a saved record from Products. |
| **Equipment/product** (`productName`) | Yes | Type the actual text. |
| **Model** (`model`) | No | Type the actual text. |
| **Quantity** (`quantity`) | Yes | Enter a plain number; use whole units for quantities/intervals and at most two decimals for money. Starting default: 1. |
| **Accessories** (`accessories`) | No | Enter the actual detailed text or notes. |
| **Warranty requirement** (`warrantyRequirement`) | No | Enter the actual detailed text or notes. |
| **Delivery location** (`deliveryLocation`) | No | Type the actual text. |
| **Required delivery time** (`requiredDeliveryTime`) | No | Type the actual text. |
| **Tender deadline** (`tenderDeadline`) | No | Choose date/time in the device timezone; imports need an ISO timestamp with Z or an offset. |
| **Quote required by** (`quoteRequiredBy`) | No | Choose date/time in the device timezone; imports need an ISO timestamp with Z or an offset. |
| **Assigned employee** (`assignedToId`) | No | Search and select a saved record from active employee directory. |
| **RFQ status** (`status`) | Yes | Choose: DRAFT, READY_TO_SEND, SENT, AWAITING_RESPONSE, QUOTE_RECEIVED, REVISION_REQUESTED, FINAL_QUOTE_RECEIVED, CLOSED, CANCELLED. Starting default: DRAFT. |
| **Actual sent date** (`sentAt`) | No | Choose date/time in the device timezone; imports need an ISO timestamp with Z or an offset. |
| **Notes** (`notes`) | No | Enter the actual detailed text or notes. |
| **Historical record** (`historical`) | No | Tick Yes when true; leave unticked for No. |
| **Original transaction date** (`originalDate`) | No | Choose the actual calendar date; import as YYYY-MM-DD. |
| **Record source** (`recordSource`) | Yes | Choose: MANUAL, PDF_ASSISTED, SYSTEM_GENERATED, FUTURE_IMPORT, FUTURE_ACCOUNTING_SYNC. Starting default: MANUAL. |

## B04. RFQ follow-ups

Open [/rfq-followups](https://medops-seven.vercel.app/rfq-followups). Record quotation follow-up and the next action date.

History rule: Edit is available with permission, subject to the status, parent-link and downstream locks described in the workflow chapters.

| Field (internal key) | Required | How to enter / available choices |
| --- | --- | --- |
| **RFQ** (`rfqId`) | Yes | Search and select a saved record from RFQs. |
| **Employee** (`employeeId`) | No | Search and select a saved record from active employee directory. |
| **Contact date** (`contactDate`) | Yes | Choose date/time in the device timezone; imports need an ISO timestamp with Z or an offset. |
| **Next follow-up** (`nextDate`) | No | Choose date/time in the device timezone; imports need an ISO timestamp with Z or an offset. |
| **Follow-up notes** (`notes`) | Yes | Enter the actual detailed text or notes. |

## B05. Manufacturer quotations

Open [/quotes](https://medops-seven.vercel.app/quotes). Manual quotations with immutable revisions. Amounts come from the actual manufacturer quote.

History rule: create a retained record; there is no normal overwrite/Edit workflow. Use the documented revision/correction/note process where available.

Files: after saving, use View > Private files for upload/download/available preview.

| Field (internal key) | Required | How to enter / available choices |
| --- | --- | --- |
| **Previous revision (optional)** (`previousQuoteId`) | No | Select the latest retained revision when adding a new revision in that same series. |
| **Quotation number** (`number`) | Yes | Type the actual text. |
| **Manufacturer** (`manufacturerId`) | Yes | Search and select a saved record from Manufacturers. |
| **RFQ (optional)** (`rfqId`) | No | Search and select a saved record from RFQs. |
| **Tender (optional)** (`tenderId`) | No | Search and select a saved record from Tenders. |
| **Saved product** (`productId`) | No | Search and select a saved record from Products. |
| **Quotation date** (`quotationDate`) | Yes | Choose the actual calendar date; import as YYYY-MM-DD. |
| **Valid until** (`validityDate`) | No | Choose the actual calendar date; import as YYYY-MM-DD. |
| **Currency code** (`currency`) | Yes | Type the actual text. Starting default: INR. |
| **Equipment/product** (`productName`) | Yes | Type the actual text. |
| **Model** (`model`) | No | Type the actual text. |
| **Quantity** (`quantity`) | Yes | Enter a plain number; use whole units for quantities/intervals and at most two decimals for money. Starting default: 1. |
| **Unit price** (`unitPrice`) | Yes | Enter a plain number; use whole units for quantities/intervals and at most two decimals for money. |
| **Tax amount** (`taxAmount`) | Yes | Enter a plain number; use whole units for quantities/intervals and at most two decimals for money. Starting default: 0. |
| **Accessories** (`accessories`) | No | Enter the actual detailed text or notes. |
| **Accessories cost** (`accessoriesCost`) | Yes | Enter a plain number; use whole units for quantities/intervals and at most two decimals for money. Starting default: 0. |
| **Freight** (`freight`) | Yes | Enter a plain number; use whole units for quantities/intervals and at most two decimals for money. Starting default: 0. |
| **Installation cost** (`installation`) | Yes | Enter a plain number; use whole units for quantities/intervals and at most two decimals for money. Starting default: 0. |
| **Warranty terms** (`warranty`) | No | Enter the actual detailed text or notes. |
| **Warranty cost** (`warrantyCost`) | Yes | Enter a plain number; use whole units for quantities/intervals and at most two decimals for money. Starting default: 0. |
| **Extended warranty cost** (`extendedWarrantyCost`) | Yes | Enter a plain number; use whole units for quantities/intervals and at most two decimals for money. Starting default: 0. |
| **Other costs** (`otherCosts`) | Yes | Enter a plain number; use whole units for quantities/intervals and at most two decimals for money. Starting default: 0. |
| **Discount amount** (`discount`) | Yes | Enter a plain number; use whole units for quantities/intervals and at most two decimals for money. Starting default: 0. |
| **Actual quoted final price (optional override)** (`finalManufacturerPrice`) | No | Optional actual final quoted price; commercial assumptions prefer it over the computed component total. |
| **Delivery lead time (days)** (`leadTimeDays`) | No | Enter a plain number; use whole units for quantities/intervals and at most two decimals for money. |
| **Payment terms** (`paymentTerms`) | No | Enter the actual detailed text or notes. |
| **Final quotation** (`isFinal`) | No | Tick Yes when true; leave unticked for No. |
| **Notes** (`notes`) | No | Enter the actual detailed text or notes. |
| **Historical record** (`historical`) | No | Tick Yes when true; leave unticked for No. |
| **Original transaction date** (`originalDate`) | No | Choose the actual calendar date; import as YYYY-MM-DD. |
| **Record source** (`recordSource`) | Yes | Choose: MANUAL, PDF_ASSISTED, SYSTEM_GENERATED, FUTURE_IMPORT, FUTURE_ACCOUNTING_SYNC. Starting default: MANUAL. |

## B06. Commercial assumptions

Open [/comparisons](https://medops-seven.vercel.app/comparisons). Compare entered costs and selling assumptions. Human selection remains final; no winner is recommended.

History rule: Edit is available with permission, subject to the status, parent-link and downstream locks described in the workflow chapters.

| Field (internal key) | Required | How to enter / available choices |
| --- | --- | --- |
| **Comparison/option name** (`name`) | Yes | Type the actual text. |
| **Tender (optional)** (`tenderId`) | No | Search and select a saved record from Tenders. |
| **RFQ (optional)** (`rfqId`) | No | Search and select a saved record from RFQs. |
| **Quotation revision (optional)** (`quoteId`) | No | Search and select a saved record from Manufacturer quotations. |
| **Currency code** (`currency`) | Yes | Type the actual text. Starting default: INR. |
| **Procurement cost (leave blank to use quote)** (`procurementCost`) | No | Leave blank to use the selected quotation’s actual final price, or its calculated total when no final price is entered. |
| **Additional commercial costs** (`additionalCosts`) | Yes | Enter a plain number; use whole units for quantities/intervals and at most two decimals for money. Starting default: 0. |
| **Proposed selling price (total)** (`sellingPrice`) | Yes | Enter the total proposed selling value for this option, not an unintended per-unit price. |
| **Delivery lead time (days)** (`leadTimeDays`) | No | Enter a plain number; use whole units for quantities/intervals and at most two decimals for money. |
| **Notes** (`notes`) | No | Enter the actual detailed text or notes. |

## B07. Tender win/loss results

Open [/results](https://medops-seven.vercel.app/results). Record actual outcomes and known competitor information. Results remain in history.

History rule: create a retained record; there is no normal overwrite/Edit workflow. Use the documented revision/correction/note process where available.

| Field (internal key) | Required | How to enter / available choices |
| --- | --- | --- |
| **Tender** (`tenderId`) | Yes | Search and select a saved record from Tenders. |
| **Outcome** (`outcome`) | Yes | Choose: WON, LOST, CANCELLED, NO_BID. |
| **Result date** (`resultDate`) | Yes | Choose the actual calendar date; import as YYYY-MM-DD. |
| **Known winner** (`winner`) | No | Type the actual text. |
| **Known winning price (optional)** (`winningPrice`) | No | Enter a plain number; use whole units for quantities/intervals and at most two decimals for money. |
| **Competitor name** (`competitorName`) | No | Type the actual text. |
| **Saved competitor** (`competitorId`) | No | Search and select a saved record from Competitors. |
| **Result reason** (`reason`) | No | Choose: PRICE, TECHNICAL, DOCUMENTATION, AUTHORIZATION, DELIVERY, ELIGIBILITY, COMMERCIAL_DECISION, BID_NOT_SUBMITTED, UNKNOWN, OTHER. |
| **Notes** (`notes`) | No | Enter the actual detailed text or notes. |
| **Historical record** (`historical`) | No | Tick Yes when true; leave unticked for No. |
| **Original transaction date** (`originalDate`) | No | Choose the actual calendar date; import as YYYY-MM-DD. |
| **Record source** (`recordSource`) | Yes | Choose: MANUAL, PDF_ASSISTED, SYSTEM_GENERATED, FUTURE_IMPORT, FUTURE_ACCOUNTING_SYNC. Starting default: MANUAL. |

## B08. Securities / EMD / PBG

Open [/securities](https://medops-seven.vercel.app/securities). Track blocked amounts, expiry and actual refunds. Enter records manually, with optional tender or order links.

History rule: Edit is available with permission, subject to the status, parent-link and downstream locks described in the workflow chapters.

Files: after saving, use View > Private files for upload/download/available preview.

| Field (internal key) | Required | How to enter / available choices |
| --- | --- | --- |
| **Security type** (`type`) | Yes | Choose: EMD, BID_SECURITY, PBG, SECURITY_DEPOSIT, WARRANTY_GUARANTEE, OTHER. |
| **Tender (optional)** (`tenderId`) | No | Search and select a saved record from Tenders. |
| **Purchase order (optional)** (`orderId`) | No | Search and select a saved record from Purchase orders. |
| **Customer** (`customerId`) | Yes | Search and select a saved record from Customers. |
| **Bank** (`bank`) | No | Type the actual text. |
| **Reference** (`reference`) | Yes | Type the actual text. |
| **Amount (INR)** (`amount`) | Yes | Enter a plain number; use whole units for quantities/intervals and at most two decimals for money. |
| **Issue date** (`issueDate`) | No | Choose the actual calendar date; import as YYYY-MM-DD. |
| **Validity date** (`validityDate`) | No | Choose the actual calendar date; import as YYYY-MM-DD. |
| **Claim expiry** (`claimExpiry`) | No | Choose the actual calendar date; import as YYYY-MM-DD. |
| **Expected refund date** (`expectedRefundDate`) | No | Choose the actual calendar date; import as YYYY-MM-DD. |
| **Actual refund date** (`actualRefundDate`) | No | Choose the actual calendar date; import as YYYY-MM-DD. |
| **Responsible employee** (`assignedToId`) | No | Search and select a saved record from active employee directory. |
| **Status** (`status`) | Yes | Choose: PLANNED, ISSUED, SUBMITTED, ACTIVE, REFUND_REQUESTED, REFUND_PENDING, REFUNDED, RELEASED, EXPIRED, INVOKED, CANCELLED. Starting default: PLANNED. |
| **Notes** (`notes`) | No | Enter the actual detailed text or notes. |
| **Historical record** (`historical`) | No | Tick Yes when true; leave unticked for No. |
| **Original transaction date** (`originalDate`) | No | Choose the actual calendar date; import as YYYY-MM-DD. |
| **Record source** (`recordSource`) | Yes | Choose: MANUAL, PDF_ASSISTED, SYSTEM_GENERATED, FUTURE_IMPORT, FUTURE_ACCOUNTING_SYNC. Starting default: MANUAL. |

## B09. Bid submission checklist

Open [/checklist](https://medops-seven.vercel.app/checklist). Commercial, technical, manufacturer, company and submission checks. Employees explicitly confirm each item; no automatic compliance decisions.

History rule: Edit is available with permission, subject to the status, parent-link and downstream locks described in the workflow chapters.

| Field (internal key) | Required | How to enter / available choices |
| --- | --- | --- |
| **Tender** (`tenderId`) | Yes | Search and select a saved record from Tenders. |
| **Section** (`section`) | Yes | Choose: COMMERCIAL, TECHNICAL, MANUFACTURER, COMPANY_DOCUMENTATION, SUBMISSION, CUSTOM. |
| **Checklist item** (`title`) | Yes | Type the actual text. |
| **Status** (`status`) | Yes | Choose: PENDING, IN_PROGRESS, COMPLETE, NOT_APPLICABLE, BLOCKED. Starting default: PENDING. |
| **Responsible employee** (`assignedToId`) | No | Search and select a saved record from active employee directory. |
| **Notes** (`notes`) | No | Enter the actual detailed text or notes. |

## B10. Approval policies

Open [/approval-policies](https://medops-seven.vercel.app/approval-policies). Administrator configuration of approver role and self-approval rules for each workflow.

History rule: Edit is available with permission, subject to the status, parent-link and downstream locks described in the workflow chapters.

| Field (internal key) | Required | How to enter / available choices |
| --- | --- | --- |
| **Workflow** (`workflow`) | Yes | Choose: TENDER_PURSUE, FINAL_BID_PRICE, RFQ, QUOTE_SELECTION, PO_ACCEPTANCE, LARGE_DISCOUNT, PAYMENT_ADJUSTMENT, CREDIT_TERMS, AMC_QUOTATION, TENDER_CANCELLATION, INVENTORY_ADJUSTMENT. |
| **Prevent self-approval** (`preventSelf`) | No | Tick Yes when true; leave unticked for No. Starting default: Yes. |
| **Approver role** (`approverRole`) | Yes | Choose: ADMIN, EMPLOYEE. Starting default: ADMIN. |
| **Notes** (`notes`) | No | Enter the actual detailed text or notes. |

## B11. Approvals

Open [/approvals](https://medops-seven.vercel.app/approvals). Create, submit and decide requests against a retained record version. Only the assigned authorized approver can decide.

History rule: Edit is available with permission, subject to the status, parent-link and downstream locks described in the workflow chapters.

| Field (internal key) | Required | How to enter / available choices |
| --- | --- | --- |
| **Approval title** (`title`) | Yes | Type the actual text. |
| **Workflow** (`workflow`) | Yes | Choose: TENDER_PURSUE, FINAL_BID_PRICE, RFQ, QUOTE_SELECTION, PO_ACCEPTANCE, LARGE_DISCOUNT, PAYMENT_ADJUSTMENT, CREDIT_TERMS, AMC_QUOTATION, TENDER_CANCELLATION, INVENTORY_ADJUSTMENT. |
| **Related module** (`relatedModule`) | Yes | Type the actual text. |
| **Related record ID** (`recordId`) | Yes | Type the actual text. |
| **Approver** (`approverId`) | Yes | Search and select a saved record from active employee directory. |
| **Approval status** (`status`) | Yes | Choose: CREATED, SUBMITTED, APPROVED, REJECTED, CHANGES_REQUESTED. Starting default: CREATED. |
| **Comments** (`comments`) | No | Enter the actual detailed text or notes. |

## B12. Email history

Open [/mail](https://medops-seven.vercel.app/mail). Only explicitly requested messages are sent. Provider credentials remain in secure environment variables.

No create/edit form. Use View and the documented specialized actions. List columns: recipient, subject, relatedModule, status, sentAt.


## B13. Service tickets

Open [/tickets](https://medops-seven.vercel.app/tickets). Create manually or for a saved device. Warranty and AMC dates are displayed from actual contracts; service does not alter them.

History rule: Edit is available with permission, subject to the status, parent-link and downstream locks described in the workflow chapters.

Files: after saving, use View > Private files for upload/download/available preview.

| Field (internal key) | Required | How to enter / available choices |
| --- | --- | --- |
| **Ticket number** (`number`) | Yes | Type the actual text. |
| **Customer** (`customerId`) | Yes | Search and select a saved record from Customers. |
| **Installed equipment (optional)** (`equipmentId`) | No | Search and select a saved record from Installed base. |
| **Manufacturer** (`manufacturerId`) | No | Search and select a saved record from Manufacturers. |
| **Serial number** (`serialNumber`) | No | Type the actual text. |
| **Equipment/product** (`productName`) | Yes | Type the actual text. |
| **Model** (`model`) | No | Type the actual text. |
| **Department** (`department`) | No | Type the actual text. |
| **Reported issue** (`issue`) | Yes | Enter the actual detailed text or notes. |
| **Priority** (`priority`) | Yes | Choose: LOW, NORMAL, HIGH, CRITICAL. Starting default: NORMAL. |
| **Reported date/time** (`reportedAt`) | Yes | Choose date/time in the device timezone; imports need an ISO timestamp with Z or an offset. |
| **Contact name** (`contactName`) | No | Type the actual text. |
| **Contact phone** (`contactPhone`) | No | Type the actual text. |
| **Assigned engineer** (`assignedToId`) | No | Search and select a saved record from active employee directory. |
| **Scheduled visit** (`scheduledVisit`) | No | Choose date/time in the device timezone; imports need an ISO timestamp with Z or an offset. |
| **Resolution** (`resolution`) | No | Enter the actual detailed text or notes. |
| **Resolved date/time** (`resolvedAt`) | No | Choose date/time in the device timezone; imports need an ISO timestamp with Z or an offset. |
| **Status** (`status`) | Yes | Choose: OPEN, ASSIGNED, VISIT_SCHEDULED, IN_PROGRESS, WAITING_FOR_PARTS, WAITING_FOR_MANUFACTURER, RESOLVED, CLOSED, CANCELLED. Starting default: OPEN. |
| **SLA rule (optional)** (`slaRuleId`) | No | Search and select a saved record from Service SLA rules. |
| **Notes** (`notes`) | No | Enter the actual detailed text or notes. |
| **Historical record** (`historical`) | No | Tick Yes when true; leave unticked for No. |
| **Original transaction date** (`originalDate`) | No | Choose the actual calendar date; import as YYYY-MM-DD. |
| **Record source** (`recordSource`) | Yes | Choose: MANUAL, PDF_ASSISTED, SYSTEM_GENERATED, FUTURE_IMPORT, FUTURE_ACCOUNTING_SYNC. Starting default: MANUAL. |

## B14. Engineer service visits

Open [/ticket-visits](https://medops-seven.vercel.app/ticket-visits). Record actual visit start, work, acknowledgement and completion. Attach photographs or a service report privately.

History rule: Edit is available with permission, subject to the status, parent-link and downstream locks described in the workflow chapters.

Files: after saving, use View > Private files for upload/download/available preview.

| Field (internal key) | Required | How to enter / available choices |
| --- | --- | --- |
| **Service ticket** (`ticketId`) | Yes | Search and select a saved record from Service tickets. |
| **Engineer** (`engineerId`) | Yes | Search and select a saved record from active employee directory. |
| **Scheduled date/time** (`scheduledAt`) | Yes | Choose date/time in the device timezone; imports need an ISO timestamp with Z or an offset. |
| **Started date/time** (`startedAt`) | No | Choose date/time in the device timezone; imports need an ISO timestamp with Z or an offset. |
| **Completed date/time** (`completedAt`) | No | Choose date/time in the device timezone; imports need an ISO timestamp with Z or an offset. |
| **Status** (`status`) | Yes | Choose: SCHEDULED, STARTED, COMPLETED, CANCELLED. Starting default: SCHEDULED. |
| **Work performed** (`workDone`) | No | Enter the actual detailed text or notes. |
| **Customer representative** (`representative`) | No | Type the actual text. |
| **Acknowledgement** (`acknowledgement`) | No | Enter the actual detailed text or notes. |
| **Next visit** (`nextVisit`) | No | Choose date/time in the device timezone; imports need an ISO timestamp with Z or an offset. |
| **Notes** (`notes`) | No | Enter the actual detailed text or notes. |

## B15. Service SLA rules

Open [/sla-rules](https://medops-seven.vercel.app/sla-rules). Optional administrator-defined assignment, first visit and resolution targets. Contracts determine the appropriate targets.

History rule: Edit is available with permission, subject to the status, parent-link and downstream locks described in the workflow chapters.

| Field (internal key) | Required | How to enter / available choices |
| --- | --- | --- |
| **Rule name** (`name`) | Yes | Type the actual text. |
| **Customer (optional)** (`customerId`) | No | Search and select a saved record from Customers. |
| **Manufacturer (optional)** (`manufacturerId`) | No | Search and select a saved record from Manufacturers. |
| **AMC (optional)** (`amcId`) | No | Search and select a saved record from AMC management. |
| **Warranty type (optional)** (`warrantyType`) | No | Type the actual text. |
| **Assignment target (hours)** (`assignmentHours`) | Yes | Enter a plain number; use whole units for quantities/intervals and at most two decimals for money. |
| **First visit target (hours)** (`firstVisitHours`) | Yes | Enter a plain number; use whole units for quantities/intervals and at most two decimals for money. |
| **Resolution target (hours)** (`resolutionHours`) | Yes | Enter a plain number; use whole units for quantities/intervals and at most two decimals for money. |
| **Active** (`active`) | No | Tick Yes when true; leave unticked for No. Starting default: Yes. |
| **Notes** (`notes`) | No | Enter the actual detailed text or notes. |

## B16. AMC opportunities

Open [/amc-opportunities](https://medops-seven.vercel.app/amc-opportunities). Actual warranty/AMC dates identify follow-up opportunities. Estimated value is entered by a person and never fabricated.

History rule: Edit is available with permission, subject to the status, parent-link and downstream locks described in the workflow chapters.

| Field (internal key) | Required | How to enter / available choices |
| --- | --- | --- |
| **Customer** (`customerId`) | Yes | Search and select a saved record from Customers. |
| **Installed equipment** (`equipmentId`) | Yes | Search and select a saved record from Installed base. |
| **Existing AMC (optional)** (`amcId`) | No | Search and select a saved record from AMC management. |
| **Opportunity reason** (`reason`) | Yes | Type the actual text. |
| **Contract expiry / trigger date** (`triggerDate`) | No | Choose the actual calendar date; import as YYYY-MM-DD. |
| **Next follow-up** (`followUpDate`) | No | Choose date/time in the device timezone; imports need an ISO timestamp with Z or an offset. |
| **Manually estimated value (INR)** (`estimatedValue`) | No | Enter a plain number; use whole units for quantities/intervals and at most two decimals for money. |
| **Status** (`status`) | Yes | Choose: NEW, CONTACTED, INTERESTED, QUOTE_SENT, NEGOTIATION, WON, LOST, NOT_APPLICABLE. Starting default: NEW. |
| **Assigned employee** (`assignedToId`) | No | Search and select a saved record from active employee directory. |
| **Notes** (`notes`) | No | Enter the actual detailed text or notes. |

## B17. Consumables catalogue

Open [/consumables](https://medops-seven.vercel.app/consumables). Maintain actual products. No clinical usage assumptions are added.

History rule: Edit is available with permission, subject to the status, parent-link and downstream locks described in the workflow chapters.

| Field (internal key) | Required | How to enter / available choices |
| --- | --- | --- |
| **SKU** (`sku`) | Yes | Type the actual text. |
| **Consumable name** (`name`) | Yes | Type the actual text. |
| **Manufacturer** (`manufacturerId`) | No | Search and select a saved record from Manufacturers. |
| **Active** (`active`) | No | Tick Yes when true; leave unticked for No. Starting default: Yes. |
| **Notes** (`notes`) | No | Enter the actual detailed text or notes. |

## B18. Product / consumable compatibility

Open [/compatibility](https://medops-seven.vercel.app/compatibility). Administrators explicitly define compatibility using manufacturer evidence.

History rule: Edit is available with permission, subject to the status, parent-link and downstream locks described in the workflow chapters.

| Field (internal key) | Required | How to enter / available choices |
| --- | --- | --- |
| **Product** (`productId`) | Yes | Search and select a saved record from Products. |
| **Consumable** (`consumableId`) | Yes | Search and select a saved record from Consumables catalogue. |
| **Active** (`active`) | No | Tick Yes when true; leave unticked for No. Starting default: Yes. |
| **Notes** (`notes`) | No | Enter the actual detailed text or notes. |

## B19. Consumable opportunities

Open [/consumable-opportunities](https://medops-seven.vercel.app/consumable-opportunities). Manual repeat-sales follow-up based on approved compatibility. No automatic usage estimates.

History rule: Edit is available with permission, subject to the status, parent-link and downstream locks described in the workflow chapters.

| Field (internal key) | Required | How to enter / available choices |
| --- | --- | --- |
| **Customer** (`customerId`) | Yes | Search and select a saved record from Customers. |
| **Installed equipment (optional)** (`equipmentId`) | No | Search and select a saved record from Installed base. |
| **Consumable** (`consumableId`) | Yes | Search and select a saved record from Consumables catalogue. |
| **Last sale date** (`lastSale`) | No | Choose the actual calendar date; import as YYYY-MM-DD. |
| **Last quantity** (`lastQuantity`) | No | Enter a plain number; use whole units for quantities/intervals and at most two decimals for money. |
| **Next follow-up** (`nextFollowUp`) | No | Choose date/time in the device timezone; imports need an ISO timestamp with Z or an offset. |
| **Status** (`status`) | Yes | Choose: NEW, CONTACTED, INTERESTED, QUOTE_SENT, NEGOTIATION, WON, LOST, NOT_APPLICABLE. Starting default: NEW. |
| **Assigned employee** (`assignedToId`) | No | Search and select a saved record from active employee directory. |
| **Notes** (`notes`) | No | Enter the actual detailed text or notes. |

## B20. Spare parts

Open [/parts](https://medops-seven.vercel.app/parts). Stock balances change only through immutable inventory transactions. Cost access requires Pricing permission.

History rule: Edit is available with permission, subject to the status, parent-link and downstream locks described in the workflow chapters.

| Field (internal key) | Required | How to enter / available choices |
| --- | --- | --- |
| **SKU** (`sku`) | Yes | Type the actual text. |
| **Part name** (`name`) | Yes | Type the actual text. |
| **Manufacturer** (`manufacturerId`) | No | Search and select a saved record from Manufacturers. |
| **Compatible models** (`compatibleModels`) | No | Enter the actual detailed text or notes. |
| **Reorder level** (`reorderLevel`) | Yes | Enter a plain number; use whole units for quantities/intervals and at most two decimals for money. Starting default: 0. |
| **Unit cost (INR)** (`unitCost`) | No | Enter a plain number; use whole units for quantities/intervals and at most two decimals for money. |
| **Storage location** (`location`) | No | Type the actual text. |
| **Supplier** (`supplier`) | No | Type the actual text. |
| **Active** (`active`) | No | Tick Yes when true; leave unticked for No. Starting default: Yes. |
| **Notes** (`notes`) | No | Enter the actual detailed text or notes. |

## B21. Inventory transactions

Open [/inventory](https://medops-seven.vercel.app/inventory). Stock in/out, reservations, release and service use retain immutable history. Privileged adjustments require a reason.

History rule: create a retained record; there is no normal overwrite/Edit workflow. Use the documented revision/correction/note process where available.

| Field (internal key) | Required | How to enter / available choices |
| --- | --- | --- |
| **Part** (`partId`) | Yes | Search and select a saved record from Spare parts. |
| **Transaction type** (`type`) | Yes | Choose: IN, OUT, RESERVE, RELEASE, USED_IN_SERVICE, RETURN, ADJUSTMENT. |
| **Quantity (signed only for adjustment)** (`quantity`) | Yes | Positive whole units for normal movements; signed non-zero units for ADJUSTMENT only. |
| **Service ticket (required for service use)** (`ticketId`) | No | Search and select a saved record from Service tickets. |
| **Engineer** (`engineerId`) | No | Search and select a saved record from active employee directory. |
| **Transaction date/time** (`transactionDate`) | Yes | Choose date/time in the device timezone; imports need an ISO timestamp with Z or an offset. |
| **Notes** (`notes`) | No | Enter the actual detailed text or notes. |
| **Unique transaction reference** (`requestId`) | Yes | Keep the generated UUID for this transaction; use a distinct UUID for a new movement. |
| **Consume reserved stock** (`fromReserved`) | No | Tick only when OUT or USED_IN_SERVICE should consume an existing reservation. |
| **Administrator confirmation of negative adjustment** (`allowNegative`) | No | Administrator-only explicit negative ADJUSTMENT confirmation; it does not waive reservation rules. |

## B22. Customer contacts

Open [/customer-contacts](https://medops-seven.vercel.app/customer-contacts). Hospital departments and actual contact details, entered manually.

History rule: Edit is available with permission, subject to the status, parent-link and downstream locks described in the workflow chapters.

| Field (internal key) | Required | How to enter / available choices |
| --- | --- | --- |
| **Customer** (`customerId`) | Yes | Search and select a saved record from Customers. |
| **Contact name** (`name`) | Yes | Type the actual text. |
| **Designation** (`designation`) | No | Type the actual text. |
| **Department** (`department`) | No | Type the actual text. |
| **Phone** (`phone`) | No | Type the actual text. |
| **Email** (`email`) | No | Enter a valid email address. |
| **Preferred channel** (`preferredChannel`) | Yes | Choose: EMAIL, PHONE, WHATSAPP, OTHER. Starting default: EMAIL. |
| **Active** (`active`) | No | Tick Yes when true; leave unticked for No. Starting default: Yes. |
| **Notes** (`notes`) | No | Enter the actual detailed text or notes. |
| **Historical record** (`historical`) | No | Tick Yes when true; leave unticked for No. |
| **Original transaction date** (`originalDate`) | No | Choose the actual calendar date; import as YYYY-MM-DD. |
| **Record source** (`recordSource`) | Yes | Choose: MANUAL, PDF_ASSISTED, SYSTEM_GENERATED, FUTURE_IMPORT, FUTURE_ACCOUNTING_SYNC. Starting default: MANUAL. |

## B23. Customer interactions

Open [/interactions](https://medops-seven.vercel.app/interactions). Calls, meetings, visits and follow-ups, with an optional related record.

History rule: Edit is available with permission, subject to the status, parent-link and downstream locks described in the workflow chapters.

| Field (internal key) | Required | How to enter / available choices |
| --- | --- | --- |
| **Customer** (`customerId`) | Yes | Search and select a saved record from Customers. |
| **Customer contact (optional)** (`contactId`) | No | Search and select a saved record from Customer contacts. |
| **Employee** (`employeeId`) | Yes | Search and select a saved record from active employee directory. |
| **Interaction type** (`type`) | Yes | Choose: CALL, MEETING, EMAIL, VISIT, TENDER, SERVICE, PAYMENT, OTHER. |
| **Date/time** (`occurredAt`) | Yes | Choose date/time in the device timezone; imports need an ISO timestamp with Z or an offset. |
| **Next follow-up** (`nextFollowUp`) | No | Choose date/time in the device timezone; imports need an ISO timestamp with Z or an offset. |
| **Related module (optional)** (`relatedModule`) | No | Type the actual text. |
| **Related record ID (optional)** (`recordId`) | No | Type the actual text. |
| **Interaction notes** (`notes`) | Yes | Enter the actual detailed text or notes. |

## B24. Sales pipeline

Open [/pipeline](https://medops-seven.vercel.app/pipeline). Track actual opportunities. Values and probabilities remain blank until a person enters them.

History rule: Edit is available with permission, subject to the status, parent-link and downstream locks described in the workflow chapters.

| Field (internal key) | Required | How to enter / available choices |
| --- | --- | --- |
| **Opportunity title** (`title`) | Yes | Type the actual text. |
| **Opportunity type** (`type`) | Yes | Choose: TENDER, AMC, CONSUMABLE, REPLACEMENT, NEW_EQUIPMENT, SERVICE, OTHER. |
| **Stage** (`stage`) | Yes | Choose: IDENTIFIED, REVIEWING, QUALIFIED, QUOTE_REQUESTED, QUOTE_SENT, NEGOTIATION, WON, LOST. Starting default: IDENTIFIED. |
| **Customer** (`customerId`) | Yes | Search and select a saved record from Customers. |
| **Manufacturer** (`manufacturerId`) | No | Search and select a saved record from Manufacturers. |
| **Product** (`productId`) | No | Search and select a saved record from Products. |
| **Tender (optional)** (`tenderId`) | No | Search and select a saved record from Tenders. |
| **Manually estimated value (INR)** (`estimatedValue`) | No | Enter a plain number; use whole units for quantities/intervals and at most two decimals for money. |
| **Human-entered probability (%)** (`probability`) | No | Enter a plain number; use whole units for quantities/intervals and at most two decimals for money. |
| **Expected close** (`expectedClose`) | No | Choose the actual calendar date; import as YYYY-MM-DD. |
| **Assigned employee** (`assignedToId`) | No | Search and select a saved record from active employee directory. |
| **Notes** (`notes`) | No | Enter the actual detailed text or notes. |

## B25. Competitors

Open [/competitors](https://medops-seven.vercel.app/competitors). Manually entered or publicly known information. Unknown prices are left blank.

History rule: Edit is available with permission, subject to the status, parent-link and downstream locks described in the workflow chapters.

| Field (internal key) | Required | How to enter / available choices |
| --- | --- | --- |
| **Company** (`company`) | Yes | Type the actual text. |
| **Known brands** (`brands`) | No | Type the actual text. |
| **Categories** (`categories`) | No | Type the actual text. |
| **Notes** (`notes`) | No | Enter the actual detailed text or notes. |

## B26. Competitor / customer history

Open [/competitor-customers](https://medops-seven.vercel.app/competitor-customers). Actual known customer and category associations.

History rule: Edit is available with permission, subject to the status, parent-link and downstream locks described in the workflow chapters.

| Field (internal key) | Required | How to enter / available choices |
| --- | --- | --- |
| **Competitor** (`competitorId`) | Yes | Search and select a saved record from Competitors. |
| **Customer** (`customerId`) | Yes | Search and select a saved record from Customers. |
| **Category** (`category`) | No | Type the actual text. |
| **Notes** (`notes`) | No | Enter the actual detailed text or notes. |

## B27. Operational costs

Open [/costs](https://medops-seven.vercel.app/costs). Enter actual recorded costs. Operational contribution reporting does not replace accounting software.

History rule: Edit is available with permission, subject to the status, parent-link and downstream locks described in the workflow chapters.

| Field (internal key) | Required | How to enter / available choices |
| --- | --- | --- |
| **Cost description** (`title`) | Yes | Type the actual text. |
| **Category** (`category`) | Yes | Choose: MANUFACTURER_PURCHASE, FREIGHT, INSURANCE, INSTALLATION, TRAVEL, LODGING, ACCESSORIES, WARRANTY_SUPPORT, SERVICE, SPARE_PARTS, TENDER_FEES, BANK_CHARGES, OTHER. |
| **Amount (INR)** (`amount`) | Yes | Enter a plain number; use whole units for quantities/intervals and at most two decimals for money. |
| **Incurred date** (`incurredDate`) | Yes | Choose the actual calendar date; import as YYYY-MM-DD. |
| **Customer** (`customerId`) | Yes | Search and select a saved record from Customers. |
| **Manufacturer (optional)** (`manufacturerId`) | No | Search and select a saved record from Manufacturers. |
| **Product (optional)** (`productId`) | No | Search and select a saved record from Products. |
| **Tender (optional)** (`tenderId`) | No | Search and select a saved record from Tenders. |
| **Purchase order (optional)** (`orderId`) | No | Search and select a saved record from Purchase orders. |
| **Delivery (optional)** (`deliveryId`) | No | Search and select a saved record from Deliveries & dispatch. |
| **Installation (optional)** (`installationId`) | No | Search and select a saved record from Installations. |
| **Service ticket (optional)** (`ticketId`) | No | Search and select a saved record from Service tickets. |
| **Employee (optional)** (`employeeId`) | No | Search and select a saved record from active employee directory. |
| **Service cost** (`serviceCost`) | No | Tick Yes when true; leave unticked for No. |
| **Post-sale cost** (`postSale`) | No | Tick Yes when true; leave unticked for No. |
| **Notes** (`notes`) | No | Enter the actual detailed text or notes. |
| **Historical record** (`historical`) | No | Tick Yes when true; leave unticked for No. |
| **Original transaction date** (`originalDate`) | No | Choose the actual calendar date; import as YYYY-MM-DD. |
| **Record source** (`recordSource`) | Yes | Choose: MANUAL, PDF_ASSISTED, SYSTEM_GENERATED, FUTURE_IMPORT, FUTURE_ACCOUNTING_SYNC. Starting default: MANUAL. |

## B28. Audited financial corrections

Open [/adjustments](https://medops-seven.vercel.app/adjustments). Credit/debit notes and payment reversals retain originals. A reason, confirmation and adjustment permission are required.

History rule: create a retained record; there is no normal overwrite/Edit workflow. Use the documented revision/correction/note process where available.

| Field (internal key) | Required | How to enter / available choices |
| --- | --- | --- |
| **Invoice** (`invoiceId`) | Yes | Search and select a saved record from Invoices & receivables. |
| **Payment (only for reversal)** (`paymentId`) | No | Search and select a saved record from Payment receipts. |
| **Correction type** (`type`) | Yes | Choose: INVOICE_CREDIT, INVOICE_DEBIT, PAYMENT_REVERSAL. |
| **Base amount / reversed receipt (INR)** (`amount`) | Yes | Positive base amount for invoice credit/debit, or positive receipt amount being reversed. |
| **Tax amount (zero for reversal)** (`taxAmount`) | Yes | Actual tax correction amount for invoice credit/debit; must be zero for PAYMENT_REVERSAL. Starting default: 0. |
| **Correction date** (`adjustmentDate`) | Yes | Choose the actual calendar date; import as YYYY-MM-DD. |
| **Correction reference** (`reference`) | Yes | Type the actual text. |
| **Reason** (`reason`) | Yes | Enter the actual detailed text or notes. |
| **I confirm this financial correction** (`confirmed`) | No | Tick only after checking the invoice/payment, date, reason and effect. |

## B29. Company profile

Open [/company](https://medops-seven.vercel.app/company). One source for your company details and approved declarations.

History rule: Edit is available with permission, subject to the status, parent-link and downstream locks described in the workflow chapters.

| Field (internal key) | Required | How to enter / available choices |
| --- | --- | --- |
| **Legal company name** (`legalName`) | Yes | Type the actual text. |
| **Business address** (`address`) | Yes | Enter the actual detailed text or notes. |
| **GSTIN** (`gstin`) | No | Type the actual text. |
| **PAN** (`pan`) | No | Type the actual text. |
| **Email** (`email`) | No | Enter a valid email address. |
| **Phone** (`phone`) | No | Type the actual text. |
| **Authorized signatory** (`signatory`) | No | Type the actual text. |
| **Designation** (`designation`) | No | Type the actual text. |
| **Standard declarations** (`declarations`) | No | Enter the actual detailed text or notes. |
| **Default reminder lead time (days)** (`reminderDays`) | Yes | Enter a plain number; use whole units for quantities/intervals and at most two decimals for money. Starting default: 30. |
| **Additional company fields** (`additionalFields`) | No | Approved name/value details; they do not automatically become generator defaults unless the placeholder is completed there. |
| **Company logo file** (`logoFileId`) | No | Search and select a saved record from uploaded company-document files. |
| **Approved letterhead file** (`letterheadFileId`) | No | Search and select a saved record from uploaded company-document files. |

## B30. Customers

Open [/customers](https://medops-seven.vercel.app/customers). Institutions, contacts and addresses shared across your workflow.

History rule: Edit is available with permission, subject to the status, parent-link and downstream locks described in the workflow chapters.

| Field (internal key) | Required | How to enter / available choices |
| --- | --- | --- |
| **Historical record** (`historical`) | No | Tick Yes when true; leave unticked for No. |
| **Original transaction date** (`originalDate`) | No | Choose the actual calendar date; import as YYYY-MM-DD. |
| **Record source** (`recordSource`) | Yes | Choose: MANUAL, PDF_ASSISTED, SYSTEM_GENERATED, FUTURE_IMPORT, FUTURE_ACCOUNTING_SYNC. Starting default: MANUAL. |
| **Institution name** (`name`) | Yes | Type the actual text. |
| **Institution type** (`institutionType`) | No | Type the actual text. |
| **Address** (`address`) | No | Enter the actual detailed text or notes. |
| **State** (`state`) | No | Type the actual text. |
| **Contact person** (`contactName`) | No | Type the actual text. |
| **Email** (`email`) | No | Enter a valid email address. |
| **Phone** (`phone`) | No | Type the actual text. |
| **Notes** (`notes`) | No | Enter the actual detailed text or notes. |

## B31. Manufacturers

Open [/manufacturers](https://medops-seven.vercel.app/manufacturers). Manufacturer contacts and approved product information.

History rule: Edit is available with permission, subject to the status, parent-link and downstream locks described in the workflow chapters.

| Field (internal key) | Required | How to enter / available choices |
| --- | --- | --- |
| **Historical record** (`historical`) | No | Tick Yes when true; leave unticked for No. |
| **Original transaction date** (`originalDate`) | No | Choose the actual calendar date; import as YYYY-MM-DD. |
| **Record source** (`recordSource`) | Yes | Choose: MANUAL, PDF_ASSISTED, SYSTEM_GENERATED, FUTURE_IMPORT, FUTURE_ACCOUNTING_SYNC. Starting default: MANUAL. |
| **Manufacturer name** (`name`) | Yes | Type the actual text. |
| **Contact person** (`contactName`) | No | Type the actual text. |
| **Email** (`email`) | No | Enter a valid email address. |
| **Phone** (`phone`) | No | Type the actual text. |
| **Notes** (`notes`) | No | Enter the actual detailed text or notes. |

## B32. Products

Open [/products](https://medops-seven.vercel.app/products). Equipment models and source-backed specifications.

History rule: Edit is available with permission, subject to the status, parent-link and downstream locks described in the workflow chapters.

| Field (internal key) | Required | How to enter / available choices |
| --- | --- | --- |
| **Historical record** (`historical`) | No | Tick Yes when true; leave unticked for No. |
| **Original transaction date** (`originalDate`) | No | Choose the actual calendar date; import as YYYY-MM-DD. |
| **Record source** (`recordSource`) | Yes | Choose: MANUAL, PDF_ASSISTED, SYSTEM_GENERATED, FUTURE_IMPORT, FUTURE_ACCOUNTING_SYNC. Starting default: MANUAL. |
| **Product name** (`name`) | Yes | Type the actual text. |
| **Model** (`model`) | Yes | Type the actual text. |
| **Equipment category** (`category`) | No | Type the actual text. |
| **Manufacturer** (`manufacturerId`) | Yes | Search and select a saved record from Manufacturers. |
| **Manufacturer specifications** (`specifications`) | No | Enter the actual detailed text or notes. |

## B33. Company documents

Open [/documents](https://medops-seven.vercel.app/documents). Private certificates, datasheets and declarations. Every replacement is retained.

History rule: Edit is available with permission, subject to the status, parent-link and downstream locks described in the workflow chapters.

Files: after saving, use View > Private files for upload/download/available preview.

| Field (internal key) | Required | How to enter / available choices |
| --- | --- | --- |
| **Document name** (`name`) | Yes | Type the actual text. |
| **Category** (`category`) | Yes | Choose: GST_CERTIFICATE, PAN, REGISTRATION, MANUFACTURER_AUTHORIZATION, PAST_PERFORMANCE, PRODUCT_DATASHEET, DECLARATION, LOGO, LETTERHEAD, OTHER. |
| **Issue date** (`issueDate`) | No | Choose the actual calendar date; import as YYYY-MM-DD. |
| **Expiry date** (`expiryDate`) | No | Choose the actual calendar date; import as YYYY-MM-DD. |
| **Manufacturer** (`manufacturerId`) | No | Search and select a saved record from Manufacturers. |
| **Notes** (`notes`) | No | Enter the actual detailed text or notes. |
| **Active** (`active`) | No | Tick Yes when true; leave unticked for No. Starting default: Yes. |

## B34. Tenders

Open [/tenders](https://medops-seven.vercel.app/tenders). Manage each opportunity from initial review to a submitted, reviewed bid.

History rule: Edit is available with permission, subject to the status, parent-link and downstream locks described in the workflow chapters.

Files: after saving, use View > Private files for upload/download/available preview.

| Field (internal key) | Required | How to enter / available choices |
| --- | --- | --- |
| **Bid number** (`bidNumber`) | No | Type the actual text. |
| **Tender title** (`title`) | No | Type the actual text. |
| **State** (`state`) | No | Type the actual text. |
| **Tender source** (`source`) | No | Type the actual text. |
| **Source URL** (`sourceUrl`) | No | Type the actual text. |
| **Publication date** (`publicationDate`) | No | Choose the actual calendar date; import as YYYY-MM-DD. |
| **Historical record** (`historical`) | No | Tick Yes when true; leave unticked for No. |
| **Original transaction date** (`originalDate`) | No | Choose the actual calendar date; import as YYYY-MM-DD. |
| **Record source** (`recordSource`) | Yes | Choose: MANUAL, PDF_ASSISTED, SYSTEM_GENERATED, FUTURE_IMPORT, FUTURE_ACCOUNTING_SYNC, TENDER_TRACKER. Starting default: MANUAL. |
| **Tender number** (`number`) | Yes | Type the actual text. |
| **GeM tender URL** (`gemUrl`) | No | Type the actual text. |
| **Procuring institution** (`customerId`) | No | Search and select a saved record from Customers. |
| **Institution from source** (`institutionName`) | No | Type the actual text. |
| **Equipment category** (`category`) | No | Type the actual text. |
| **Submission deadline** (`deadline`) | No | Choose date/time in the device timezone; imports need an ISO timestamp with Z or an offset. |
| **EMD (INR)** (`emd`) | No | Enter a plain number; use whole units for quantities/intervals and at most two decimals for money. |
| **Estimated value (INR)** (`estimatedValue`) | No | Enter a plain number; use whole units for quantities/intervals and at most two decimals for money. |
| **Contractual warranty requirements** (`warrantyTerms`) | No | Enter the actual detailed text or notes. |
| **Delivery requirements** (`deliveryTerms`) | No | Enter the actual detailed text or notes. |
| **Notes** (`notes`) | No | Enter the actual detailed text or notes. |
| **Status** (`status`) | Yes | Choose: DRAFT, UNDER_REVIEW, DOCUMENTS_IN_PROGRESS, READY_FOR_SUBMISSION, SUBMITTED, WON, LOST, CANCELLED. Starting default: DRAFT. |
| **Equipment items** (`items`) | Yes | Add verified equipment lines; each entered line needs equipment name and positive reviewed quantity. |

### Equipment items - fields inside each row

| Field (internal key) | Required | How to enter / available choices |
| --- | --- | --- |
| **Saved product (optional)** (`productId`) | No | Search and select a saved record from Products. |
| **Equipment name** (`equipment`) | Yes | Type the actual text. |
| **Model** (`model`) | No | Type the actual text. |
| **Quantity** (`quantity`) | Yes | Enter a plain number; use whole units for quantities/intervals and at most two decimals for money. |
| **Manufacturer** (`manufacturerId`) | No | Search and select a saved record from Manufacturers. |
| **Item category** (`category`) | No | Type the actual text. |
| **Item source URL** (`sourceUrl`) | No | Type the actual text. |

## B35. Technical compliance

Open [/requirements](https://medops-seven.vercel.app/requirements). Enter requirements and source specifications; confirm each decision yourself.

History rule: Edit is available with permission, subject to the status, parent-link and downstream locks described in the workflow chapters.

Files: after saving, use View > Private files for upload/download/available preview.

| Field (internal key) | Required | How to enter / available choices |
| --- | --- | --- |
| **Tender** (`tenderId`) | Yes | Search and select a saved record from Tenders. |
| **Tender requirement** (`requirement`) | Yes | Enter the actual detailed text or notes. |
| **Manufacturer specification** (`specification`) | No | Enter the actual detailed text or notes. |
| **Employee compliance decision** (`compliance`) | Yes | Choose: REQUIRES_REVIEW, COMPLIES, DOES_NOT_COMPLY. Starting default: REQUIRES_REVIEW. |
| **Evidence reference and notes** (`evidenceNotes`) | No | Enter the actual detailed text or notes. |

## B36. Document templates

Open [/templates](https://medops-seven.vercel.app/templates). An administrator must approve a template before employees can generate drafts.

History rule: Edit is available with permission, subject to the status, parent-link and downstream locks described in the workflow chapters.

| Field (internal key) | Required | How to enter / available choices |
| --- | --- | --- |
| **Template name** (`name`) | Yes | Type the actual text. |
| **Document type** (`kind`) | Yes | Choose: RFQ_LETTER, COVERING_LETTER, NON_BLACKLISTING, WARRANTY_UNDERTAKING, AUTHORIZATION_REQUEST, COMPLIANCE_STATEMENT, COMPLIANCE_COMPARISON, CHECKLIST, DELIVERY_CHALLAN, PACKING_LIST, SERVICE_REPORT, INSTALLATION_REPORT, COMMISSIONING_REPORT, HANDOVER, PAYMENT_REMINDER, CUSTOM. |
| **Template text (use {{company_name}}, {{tender_number}} and other placeholders)** (`body`) | Yes | Enter the actual detailed text or notes. |
| **Approved for generation** (`approved`) | No | Tick Yes when true; leave unticked for No. |

## B37. Purchase orders

Open [/orders](https://medops-seven.vercel.app/orders). Record the official customer order, upload it, then confirm its details.

History rule: Edit is available with permission, subject to the status, parent-link and downstream locks described in the workflow chapters.

Files: after saving, use View > Private files for upload/download/available preview.

| Field (internal key) | Required | How to enter / available choices |
| --- | --- | --- |
| **Historical record** (`historical`) | No | Tick Yes when true; leave unticked for No. |
| **Original transaction date** (`originalDate`) | No | Choose the actual calendar date; import as YYYY-MM-DD. |
| **Record source** (`recordSource`) | Yes | Choose: MANUAL, PDF_ASSISTED, SYSTEM_GENERATED, FUTURE_IMPORT, FUTURE_ACCOUNTING_SYNC. Starting default: MANUAL. |
| **Official PO number** (`number`) | Yes | Type the actual text. |
| **Won tender (optional)** (`tenderId`) | No | Search and select a saved record from Tenders. |
| **Customer** (`customerId`) | Yes | Search and select a saved record from Customers. |
| **PO date** (`poDate`) | Yes | Choose the actual calendar date; import as YYYY-MM-DD. |
| **Delivery deadline** (`deliveryDeadline`) | No | Choose the actual calendar date; import as YYYY-MM-DD. |
| **Payment terms** (`paymentTerms`) | No | Enter the actual detailed text or notes. |
| **Notes** (`notes`) | No | Enter the actual detailed text or notes. |
| **Status** (`status`) | Yes | Choose: ORDER_RECEIVED, MANUFACTURER_ORDER_PENDING, MANUFACTURER_ORDER_PLACED, PROCESSING, READY_FOR_DISPATCH, PARTIALLY_DELIVERED, DELIVERED, COMPLETED, CANCELLED. Starting default: ORDER_RECEIVED. |
| **Official PO uploaded and details confirmed** (`confirmed`) | No | Save unconfirmed first, upload the real PO, then edit and tick after verifying it. |
| **Order items** (`items`) | Yes | Add individual rows using the line-field table below. |

### Order items - fields inside each row

| Field (internal key) | Required | How to enter / available choices |
| --- | --- | --- |
| **Saved product (optional)** (`productId`) | No | Search and select a saved record from Products. |
| **Equipment name** (`equipment`) | Yes | Type the actual text. |
| **Model** (`model`) | No | Type the actual text. |
| **Quantity** (`quantity`) | Yes | Enter a plain number; use whole units for quantities/intervals and at most two decimals for money. |
| **Manufacturer** (`manufacturerId`) | No | Search and select a saved record from Manufacturers. |
| **Unit price (INR)** (`unitPrice`) | Yes | Enter a plain number; use whole units for quantities/intervals and at most two decimals for money. |
| **Tax %** (`taxRate`) | Yes | Enter a plain number; use whole units for quantities/intervals and at most two decimals for money. Starting default: 0. |

## B38. Deliveries & dispatch

Open [/deliveries](https://medops-seven.vercel.app/deliveries). Track partial dispatches and confirmed receipts against specific order items.

History rule: Edit is available with permission, subject to the status, parent-link and downstream locks described in the workflow chapters.

Files: after saving, use View > Private files for upload/download/available preview.

| Field (internal key) | Required | How to enter / available choices |
| --- | --- | --- |
| **Purchase order** (`orderId`) | Yes | Search and select a saved record from Purchase orders. |
| **Dispatch date** (`dispatchDate`) | No | Choose the actual calendar date; import as YYYY-MM-DD. |
| **Transporter** (`transporter`) | No | Type the actual text. |
| **Tracking or reference** (`tracking`) | No | Type the actual text. |
| **Expected delivery date** (`expectedDate`) | No | Choose the actual calendar date; import as YYYY-MM-DD. |
| **Actual delivery date** (`actualDate`) | No | Choose the actual calendar date; import as YYYY-MM-DD. |
| **Delivery location** (`location`) | Yes | Type the actual text. |
| **Customer delivery confirmed** (`confirmed`) | No | Tick only after actual customer receipt; Actual delivery date is required. |
| **Notes** (`notes`) | No | Enter the actual detailed text or notes. |
| **Dispatched items** (`items`) | Yes | Add individual rows using the line-field table below. |

### Dispatched items - fields inside each row

| Field (internal key) | Required | How to enter / available choices |
| --- | --- | --- |
| **Order item** (`orderItemId`) | Yes | Search and select a saved record from saved purchase-order line items. |
| **Quantity dispatched** (`quantity`) | Yes | Enter a plain number; use whole units for quantities/intervals and at most two decimals for money. |

## B39. Installed base

Open [/equipment](https://medops-seven.vercel.app/equipment). Register each received unit before tracking installation, warranty or maintenance.

History rule: create a retained record; there is no normal overwrite/Edit workflow. Use the documented revision/correction/note process where available.

| Field (internal key) | Required | How to enter / available choices |
| --- | --- | --- |
| **Serial number** (`serialNumber`) | Yes | Type the actual text. |
| **Confirmed delivery (optional for historical)** (`deliveryId`) | No | Search and select a saved record from Deliveries & dispatch. |
| **Purchase order (optional for historical)** (`orderId`) | No | Search and select a saved record from Purchase orders. |
| **Order item (optional for historical)** (`orderItemId`) | No | Search and select a saved record from saved purchase-order line items. |
| **Customer** (`customerId`) | Yes | Search and select a saved record from Customers. |
| **Manufacturer** (`manufacturerId`) | No | Search and select a saved record from Manufacturers. |
| **Saved product** (`productId`) | No | Search and select a saved record from Products. |
| **Equipment/product** (`productName`) | No | Type the actual text. |
| **Model** (`model`) | No | Type the actual text. |
| **Hospital location** (`location`) | No | Type the actual text. |
| **Department** (`department`) | No | Type the actual text. |
| **Notes** (`notes`) | No | Enter the actual detailed text or notes. |
| **Historical record** (`historical`) | No | Tick Yes when true; leave unticked for No. |
| **Original transaction date** (`originalDate`) | No | Choose the actual calendar date; import as YYYY-MM-DD. |
| **Record source** (`recordSource`) | Yes | Choose: MANUAL, PDF_ASSISTED, SYSTEM_GENERATED, FUTURE_IMPORT, FUTURE_ACCOUNTING_SYNC. Starting default: MANUAL. |

## B40. Installations

Open [/installations](https://medops-seven.vercel.app/installations). Confirm equipment installation, commissioning and customer acceptance.

History rule: Edit is available with permission, subject to the status, parent-link and downstream locks described in the workflow chapters.

| Field (internal key) | Required | How to enter / available choices |
| --- | --- | --- |
| **Equipment serial number** (`equipmentId`) | Yes | Search and select a saved record from Installed base. |
| **Installation status** (`status`) | Yes | Choose: PENDING, PARTIAL, INSTALLED, COMMISSIONED, ACCEPTED. Starting default: PENDING. |
| **Installation date** (`installationDate`) | No | Choose the actual calendar date; import as YYYY-MM-DD. |
| **Commissioning date** (`commissioningDate`) | No | Choose the actual calendar date; import as YYYY-MM-DD. |
| **Customer acceptance date** (`acceptanceDate`) | No | Choose the actual calendar date; import as YYYY-MM-DD. |
| **Notes** (`notes`) | No | Enter the actual detailed text or notes. |
| **Historical record** (`historical`) | No | Tick Yes when true; leave unticked for No. |
| **Original transaction date** (`originalDate`) | No | Choose the actual calendar date; import as YYYY-MM-DD. |
| **Record source** (`recordSource`) | Yes | Choose: MANUAL, PDF_ASSISTED, SYSTEM_GENERATED, FUTURE_IMPORT, FUTURE_ACCOUNTING_SYNC. Starting default: MANUAL. |

## B41. Warranty management

Open [/warranties](https://medops-seven.vercel.app/warranties). Expiry is calculated from the confirmed commencement event in the contract.

History rule: create a retained record; there is no normal overwrite/Edit workflow. Use the documented revision/correction/note process where available.

Files: after saving, use View > Private files for upload/download/available preview.

| Field (internal key) | Required | How to enter / available choices |
| --- | --- | --- |
| **Warranty type** (`type`) | Yes | Type the actual text. Starting default: STANDARD. |
| **Equipment** (`equipmentId`) | Yes | Search and select a saved record from Installed base. |
| **Contractual start event** (`commencement`) | Yes | Choose: DELIVERY, INSTALLATION, COMMISSIONING, ACCEPTANCE, CONTRACT. |
| **Warranty duration (months)** (`durationMonths`) | Yes | Enter a plain number; use whole units for quantities/intervals and at most two decimals for money. |
| **Explicit contract / historical start date** (`startDate`) | No | Use for explicit CONTRACT commencement or actual historical entry; otherwise the recorded event date supplies it. |
| **Historical end date (optional)** (`endDate`) | No | Original historical end date only; normal end is calculated from start and duration. |
| **Warranty terms** (`terms`) | Yes | Enter the actual detailed text or notes. |
| **Notes** (`notes`) | No | Enter the actual detailed text or notes. |
| **Historical record** (`historical`) | No | Tick Yes when true; leave unticked for No. |
| **Original transaction date** (`originalDate`) | No | Choose the actual calendar date; import as YYYY-MM-DD. |
| **Record source** (`recordSource`) | Yes | Choose: MANUAL, PDF_ASSISTED, SYSTEM_GENERATED, FUTURE_IMPORT, FUTURE_ACCOUNTING_SYNC. Starting default: MANUAL. |

## B42. AMC management

Open [/amcs](https://medops-seven.vercel.app/amcs). Contracts, covered devices, preventive maintenance and renewals.

History rule: Edit is available with permission, subject to the status, parent-link and downstream locks described in the workflow chapters.

Files: after saving, use View > Private files for upload/download/available preview.

| Field (internal key) | Required | How to enter / available choices |
| --- | --- | --- |
| **Historical record** (`historical`) | No | Tick Yes when true; leave unticked for No. |
| **Original transaction date** (`originalDate`) | No | Choose the actual calendar date; import as YYYY-MM-DD. |
| **Record source** (`recordSource`) | Yes | Choose: MANUAL, PDF_ASSISTED, SYSTEM_GENERATED, FUTURE_IMPORT, FUTURE_ACCOUNTING_SYNC. Starting default: MANUAL. |
| **AMC contract number** (`number`) | Yes | Type the actual text. |
| **Customer** (`customerId`) | Yes | Search and select a saved record from Customers. |
| **Contract start** (`startDate`) | Yes | Choose the actual calendar date; import as YYYY-MM-DD. |
| **Contract end** (`endDate`) | Yes | Choose the actual calendar date; import as YYYY-MM-DD. |
| **AMC amount (INR)** (`amount`) | Yes | Enter a plain number; use whole units for quantities/intervals and at most two decimals for money. |
| **Service frequency (months)** (`serviceFrequencyMonths`) | Yes | Enter a plain number; use whole units for quantities/intervals and at most two decimals for money. |
| **Next scheduled service** (`nextServiceDate`) | No | Choose the actual calendar date; import as YYYY-MM-DD. |
| **Responsible employee** (`responsibleName`) | No | Type the actual text. |
| **Status** (`status`) | Yes | Choose: ACTIVE, EXPIRED, CANCELLED. Starting default: ACTIVE. |
| **Previous AMC (renewal)** (`renewedFromId`) | No | Search and select a saved record from AMC management. |
| **Covered equipment** (`equipmentIds`) | Yes | Choose all covered devices from the same customer. In imports, separate their IDs with semicolons. |
| **Notes** (`notes`) | No | Enter the actual detailed text or notes. |

## B43. Maintenance & service visits

Open [/visits](https://medops-seven.vercel.app/visits). Plan visits, record complaints and retain service reports.

History rule: Edit is available with permission, subject to the status, parent-link and downstream locks described in the workflow chapters.

Files: after saving, use View > Private files for upload/download/available preview.

| Field (internal key) | Required | How to enter / available choices |
| --- | --- | --- |
| **Historical record** (`historical`) | No | Tick Yes when true; leave unticked for No. |
| **Original transaction date** (`originalDate`) | No | Choose the actual calendar date; import as YYYY-MM-DD. |
| **Record source** (`recordSource`) | Yes | Choose: MANUAL, PDF_ASSISTED, SYSTEM_GENERATED, FUTURE_IMPORT, FUTURE_ACCOUNTING_SYNC. Starting default: MANUAL. |
| **AMC contract** (`amcId`) | Yes | Search and select a saved record from AMC management. |
| **Assigned employee** (`employeeId`) | No | Search and select a saved record from active employee directory. |
| **Scheduled date** (`scheduledDate`) | Yes | Choose the actual calendar date; import as YYYY-MM-DD. |
| **Completed date** (`completedDate`) | No | Choose the actual calendar date; import as YYYY-MM-DD. |
| **Service status** (`status`) | Yes | Choose: SCHEDULED, COMPLETED, COMPLAINT, CANCELLED. Starting default: SCHEDULED. |
| **Service complaint** (`complaint`) | No | Enter the actual detailed text or notes. |
| **Notes** (`notes`) | No | Enter the actual detailed text or notes. |

## B44. Invoices & receivables

Open [/invoices](https://medops-seven.vercel.app/invoices). Track customer invoices, due dates and outstanding balances.

History rule: create a retained record; there is no normal overwrite/Edit workflow. Use the documented revision/correction/note process where available.

Files: after saving, use View > Private files for upload/download/available preview.

| Field (internal key) | Required | How to enter / available choices |
| --- | --- | --- |
| **Historical record** (`historical`) | No | Tick Yes when true; leave unticked for No. |
| **Original transaction date** (`originalDate`) | No | Choose the actual calendar date; import as YYYY-MM-DD. |
| **Record source** (`recordSource`) | Yes | Choose: MANUAL, PDF_ASSISTED, SYSTEM_GENERATED, FUTURE_IMPORT, FUTURE_ACCOUNTING_SYNC. Starting default: MANUAL. |
| **Invoice number** (`number`) | Yes | Type the actual text. |
| **Purchase order (optional for historical)** (`orderId`) | No | Normal invoices require the matching confirmed PO; historical administrator entry has the stated exception. |
| **Customer** (`customerId`) | Yes | Search and select a saved record from Customers. |
| **Invoice date** (`invoiceDate`) | Yes | Choose the actual calendar date; import as YYYY-MM-DD. |
| **Invoice base amount (INR)** (`amount`) | Yes | Enter a plain number; use whole units for quantities/intervals and at most two decimals for money. |
| **Tax amount (INR)** (`taxAmount`) | Yes | Enter the actual tax amount in INR, not a percentage. Starting default: 0. |
| **Payment terms (days)** (`paymentTermDays`) | Yes | Enter a plain number; use whole units for quantities/intervals and at most two decimals for money. |
| **Original due date (historical only)** (`dueDate`) | No | Only a historical invoice may supply an original due date; normal due date is calculated. |
| **Notes** (`notes`) | No | Enter the actual detailed text or notes. |

## B45. Payment receipts

Open [/payments](https://medops-seven.vercel.app/payments). Each receipt is retained separately; overpayments are blocked.

History rule: create a retained record; there is no normal overwrite/Edit workflow. Use the documented revision/correction/note process where available.

| Field (internal key) | Required | How to enter / available choices |
| --- | --- | --- |
| **Historical record** (`historical`) | No | Tick Yes when true; leave unticked for No. |
| **Original transaction date** (`originalDate`) | No | Choose the actual calendar date; import as YYYY-MM-DD. |
| **Record source** (`recordSource`) | Yes | Choose: MANUAL, PDF_ASSISTED, SYSTEM_GENERATED, FUTURE_IMPORT, FUTURE_ACCOUNTING_SYNC. Starting default: MANUAL. |
| **Invoice** (`invoiceId`) | Yes | Search and select a saved record from Invoices & receivables. |
| **Amount received (INR)** (`amount`) | Yes | Enter a plain number; use whole units for quantities/intervals and at most two decimals for money. |
| **Payment date** (`paymentDate`) | Yes | Choose the actual calendar date; import as YYYY-MM-DD. |
| **Payment reference** (`reference`) | Yes | Type the actual text. |
| **Payment method** (`method`) | Yes | Choose: BANK_TRANSFER, CHEQUE, CASH, OTHER. |
| **Notes** (`notes`) | No | Enter the actual detailed text or notes. |

## B46. Payment follow-ups

Open [/followups](https://medops-seven.vercel.app/followups). Record contact history and schedule the next customer follow-up.

History rule: Edit is available with permission, subject to the status, parent-link and downstream locks described in the workflow chapters.

| Field (internal key) | Required | How to enter / available choices |
| --- | --- | --- |
| **Invoice** (`invoiceId`) | Yes | Search and select a saved record from Invoices & receivables. |
| **Responsible employee** (`employeeId`) | No | Search and select a saved record from active employee directory. |
| **Contact date** (`contactDate`) | Yes | Choose the actual calendar date; import as YYYY-MM-DD. |
| **Next follow-up date** (`nextDate`) | No | Choose the actual calendar date; import as YYYY-MM-DD. |
| **Follow-up notes** (`notes`) | Yes | Enter the actual detailed text or notes. |

## B47. User accounts & permissions

Open [/users](https://medops-seven.vercel.app/users). Administrators control module access. Password changes revoke existing sessions.

History rule: Edit is available with permission, subject to the status, parent-link and downstream locks described in the workflow chapters.

| Field (internal key) | Required | How to enter / available choices |
| --- | --- | --- |
| **Employee name** (`name`) | Yes | Type the actual text. |
| **Email** (`email`) | Yes | Enter a valid email address. |
| **New password (12+ characters)** (`password`) | No | Required for a new account; leave blank on Edit to keep the current password. At least 12 characters. |
| **Role** (`role`) | Yes | Choose: EMPLOYEE, ADMIN. |
| **Account active** (`active`) | No | Tick Yes when true; leave unticked for No. Starting default: Yes. |
| **Module permissions** (`permissions`) | No | Choose View/Edit for each module/action; Edit also needs View. |

## B48. Tasks & follow-ups

Open [/tasks](https://medops-seven.vercel.app/tasks). Assign work, set deadlines and track completion. Employees see tasks they created or were assigned.

History rule: Edit is available with permission, subject to the status, parent-link and downstream locks described in the workflow chapters.

| Field (internal key) | Required | How to enter / available choices |
| --- | --- | --- |
| **Task title** (`title`) | Yes | Type the actual text. |
| **Assigned employee** (`assignedToId`) | No | Search and select a saved record from active employee directory. |
| **Due date** (`dueDate`) | No | Choose the actual calendar date; import as YYYY-MM-DD. |
| **Status** (`status`) | Yes | Choose: OPEN, IN_PROGRESS, DONE, CANCELLED. Starting default: OPEN. |
| **Priority** (`priority`) | Yes | Choose: LOW, NORMAL, HIGH, URGENT. Starting default: NORMAL. |
| **Notes** (`notes`) | No | Enter the actual detailed text or notes. |

## B49. Notifications

Open [/notifications](https://medops-seven.vercel.app/notifications). Deadlines and follow-ups assigned to you.

No create/edit form. Use View and the documented specialized actions. List columns: title, priority, createdAt, readAt.


## B50. Audit history

Open [/audit](https://medops-seven.vercel.app/audit). Sensitive changes, file access and review decisions.

No create/edit form. Use View and the documented specialized actions. List columns: action, module, user, createdAt.


## B51. Generated document history

Open [/generated](https://medops-seven.vercel.app/generated). Retained drafts and review decisions. Download and review each document.

No create/edit form. Use View and the documented specialized actions. List columns: file, format, sourceModule, createdAt, reviewedAt.


# Appendix C. Generator source and placeholder reference

## C1. Choose a compatible template

A Custom template is permitted for each listed source. A mismatched template/source is rejected.

| Source record type | Supported template kinds |
| --- | --- | --- |
| RFQ | RFQ_LETTER, CUSTOM |
| Tender | COVERING_LETTER, NON_BLACKLISTING, WARRANTY_UNDERTAKING, AUTHORIZATION_REQUEST, COMPLIANCE_STATEMENT, COMPLIANCE_COMPARISON, CHECKLIST, CUSTOM |
| Delivery | DELIVERY_CHALLAN, PACKING_LIST, CUSTOM |
| Installation | INSTALLATION_REPORT, COMMISSIONING_REPORT, HANDOVER, CUSTOM |
| Invoice | PAYMENT_REMINDER, CUSTOM |
| Engineer service visit | SERVICE_REPORT, CUSTOM |

## C2. Values loaded from saved information

These exact placeholder names are supplied for the relevant source. Other placeholders can be entered manually in the generator; they are not automatically invented from the database. Blank defaults still need verified input when the selected template uses them.

### All sources

`{{company_name}}`, `{{company_address}}`, `{{authorized_signatory}}`, `{{declaration_text}}`.

### RFQ

`{{rfq_number}}`, `{{manufacturer_name}}`, `{{contact_name}}`, `{{hospital_name}}`, `{{equipment_name}}`, `{{model_number}}`, `{{quantity}}`, `{{accessories}}`, `{{warranty_period}}`, `{{delivery_location}}`, `{{delivery_time}}`, `{{quote_required_by}}`, `{{report_notes}}`.

### Tender

`{{tender_number}}`, `{{hospital_name}}`, `{{equipment_name}}`, `{{manufacturer_name}}`, `{{model_number}}`, `{{quantity}}`, `{{warranty_period}}`.

### Delivery

`{{po_number}}`, `{{hospital_name}}`, `{{delivery_location}}`, `{{tracking_number}}`, `{{items_text}}`, `{{serial_numbers}}`.

### Installation

`{{hospital_name}}`, `{{equipment_name}}`, `{{serial_numbers}}`, `{{installation_date}}`, `{{commissioning_date}}`, `{{acceptance_date}}`, `{{report_notes}}`.

### Invoice

`{{hospital_name}}`, `{{invoice_number}}`, `{{invoice_total}}`, `{{outstanding_amount}}`, `{{due_date}}`.

### Engineer service visit

`{{hospital_name}}`, `{{ticket_number}}`, `{{equipment_name}}`, `{{serial_number}}`, `{{reported_issue}}`, `{{work_done}}`, `{{visit_date}}`, `{{representative}}`, `{{acknowledgement}}`, `{{report_notes}}`.

Invoice totals/outstanding use the current corrected ledger. Tender equipment/manufacturer/model/quantity placeholders join the saved lines; check their ordering and meaning. Delivery serials are available only after those serial records exist. Quote-required-by is a formatted date in the default text, not a promise that every generated letter includes a precise deadline time; add/verify the actual time in the draft when needed.

## C3. Final use check

Read the actual generated file, not only the preview. Confirm source identity, numbers, dates, specification evidence, signatory authority, required language, attachments and portal/customer-specific format. Confirm draft/package review in MedOps, then complete any external signing/submission/send through the actual authorized business process.
