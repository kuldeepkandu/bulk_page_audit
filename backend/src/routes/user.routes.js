import { Router } from "express";
import { abortScan, checkPageSpeedBatch, clearLatestComparedAudits, compareAudits, crawlAndStoreUrls, exportToCsv, exportToCsvScan, getAllScanHistory, getLatestComparedAudits, getMultipleScanResults, getUniqueUrls, registerUser, retryFailedScan, retryFailedScansBulk, testEndpoint, testbodyparser } from "../controllers/user.controller.js";
import { uploadMemory } from "../middlewares/multer.middleware.js";

const router = Router()

router.route("/register").post(registerUser);
router.route("/crawlUrls").post(crawlAndStoreUrls); // http://localhost:5000/api/v1/users/crawlUrls
router.route("/pagespeed").post(checkPageSpeedBatch); // http://localhost:5000/api/v1/users/pagespeed
router.route("/abortScan/:batchId").post(abortScan); // http://localhost:5000/api/v1/users/abortScan/:batchId
router.route("/test").get(testEndpoint); // http://localhost:5000/api/v1/users/test
router.route("/results/:batchId").get(getMultipleScanResults); // http://localhost:5000/api/v1/users/results
router.route("/getAllScanHistory").get(getAllScanHistory)   // http://localhost:5000/api/v1/users/getAllScanHistory
router.route("/getUniqueUrls").get(getUniqueUrls)   // http://localhost:5000/api/v1/users/getUniqueUrls
router.route("/retryFailedScan").post(retryFailedScan) // http://localhost:5000/api/v1/users/retryFailedScan
router.route("/retryFailedScansBulk").post(retryFailedScansBulk) // http://localhost:5000/api/v1/users/retryFailedScansBulk
router.route("/exportToCsv").post(exportToCsv) //http://localhost:5000/api/v1/users/exportToCsv
router.route("/testbodyparser").post(testbodyparser) //http://localhost:5000/api/v1/users/testbodyparser
router.route("/exportToCsvScan").post(exportToCsvScan) //http://localhost:5000/api/v1/users/exportToCsvScan
router.route("/compareAudits").post(uploadMemory.fields([{ name: 'before' }, { name: 'after' }]), compareAudits) // http://localhost:5000/api/v1/users/compareAudits
router.route("/compareAudits/latest").get(getLatestComparedAudits).delete(clearLatestComparedAudits)

export default router;