var express = require("express");
var mongoose = require("mongoose");
var path = require("path");
var cors = require("cors");
var fileuploader = require("express-fileupload");

var app = express();
app.listen(2005, function() {
    console.log("Server Started...");
});

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(fileuploader());
app.use(cors());
var url="mongodb+srv://jindalrakshit3:64RVhrMLggshHNQn@cluster0.nq3c7.mongodb.net/Franchise"
mongoose.connect(url).then(()=>{
    console.log("Connected");
}).catch((err)=>{
    console.log(err.message);
})

const initAdminUser = async () => {
    try {
        const adminExists = await LoginRef.findOne({ user: 'admin' });
        if (!adminExists) {
            const adminUser = new LoginRef({
                user: 'admin',
                pwd: 'admin123',
                role: 'admin'
            });
            await adminUser.save();
            console.log('Admin user created successfully');
        }
    } catch (error) {
        console.error('Error creating admin user:', error);
    }
};

initAdminUser();

var userSchema =mongoose.Schema;

var applicantSchemaa={
    uid:{type:String,required:true,index:true,unique:true},
    name:{type:String},
    mob:{type:Number},
    addr:{type:String},
    existing:{type:String,default:"None"},
    since:{type:Number,default:0},
    site_address:{type:String},
    site_city:{type:String},
    site_postal:{type:Number},
    site_area:{type:Number},
    site_floor:{type:Number},
    doa:{type:Date,default:Date.now()},
    picpath:{type:String},
    owner:{type:String},
    status:{type:Number,default:0}
}
var LoginSchemaa={
    user:{type:String,required:true,unique:true},
    pwd:{type:String},
    role: { type: String, default: 'user' }
}
var SalesSchemaa={
    uid:{type:String,default:"abc@gmail.com"},
    date:{type:Date,default:Date.now()},
    sales:{type:Number},
    customers:{type:Number}
}
var ver={
    versionKey:false,
}
var applicantSchema=new userSchema(applicantSchemaa,ver)
var LoginSchema= new userSchema(LoginSchemaa,ver)
var SalesSchema = new userSchema(SalesSchemaa,ver)

var ApplicantRef=mongoose.model("applicantCollection",applicantSchema)
var LoginRef=mongoose.model("loginCollection",LoginSchema)
var SalesRef=mongoose.model("salesCollection",SalesSchema)

app.post("/saveapplicant",async(req,resp)=>{
    let filename="nopic.jpg";

    if (req.files && req.files.ppic) {
        const uniqueFilename = `${Date.now()}_${req.files.ppic.name}`;
        const filepath = path.join(__dirname, "..","uploads", uniqueFilename);

        try {
            await req.files.ppic.mv(filepath);
            console.log("File uploaded successfully");
            filename = uniqueFilename; 
        } catch (err) {
            console.error("File upload failed:", err);
            return resp.json({ status: false, msg: "File upload failed" });
        }
    } else {
        console.log("No file uploaded");
    }

    var userJson =new ApplicantRef(req.body);

    userJson.save().then((document)=>{
        resp.json({doc:document,status:true,msg:"saved"})
    }).catch((err)=>{
        resp.json({status:false,msg:err.message});
    })
})

app.get("/allapplications", async (req, resp) => {
    try {
        const documents = await ApplicantRef.find();
        resp.status(200).json(documents);
    } catch (err) {
        console.error("Error fetching data:", err.message);
        resp.status(500).json({ error: err.message });
    }
});

app.post("/updatestatus", async (req, resp) => {
    console.log("Received update request:", req.body);
    const { uid, status } = req.body;

    if (!uid || status === undefined) {
        console.log("Invalid request data:", { uid, status });
        return resp.status(400).json({ status: false, msg: "Invalid UID or status" });
    }

    try {
        const updatedDoc = await ApplicantRef.findOneAndUpdate(
            { uid: uid },
            { $set: { status: status } },
            { 
                new: true,
                runValidators: true
            }
        );

        if (!updatedDoc) {
            console.log("No document found for UID:", uid);
            return resp.status(404).json({ status: false, msg: "Applicant not found" });
        }

        console.log("Successfully updated document:", updatedDoc);
        resp.status(200).json({ status: true, msg: "Status updated successfully", doc: updatedDoc });
    } catch (err) {
        console.error("Error updating status:", err);
        resp.status(500).json({ status: false, msg: err.message });
    }
});

app.get("/showfilter/:status", async (req, resp) => {
    try {
        const status = parseInt(req.params.status);
        
        if (isNaN(status)) {
            return resp.status(400).json({ 
                error: "Invalid status parameter" 
            });
        }

        const documents = await ApplicantRef.find({ status: status });
        
        console.log(`Filtered applications for status ${status}:`, documents.length);
        resp.status(200).json(documents);
    } catch (err) {
        console.error("Error fetching filtered data:", err.message);
        resp.status(500).json({ 
            error: err.message 
        });
    }
});


app.post("/savelogin", async (req, resp) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return resp.status(400).json({ 
            status: false, 
            msg: "Username and password are required" 
        });
    }

    try {
        const loginDoc = new LoginRef({
            user: username,
            pwd: password,
            role: 'user'
        });

        const savedDoc = await loginDoc.save();
        console.log("Login credentials saved:", savedDoc);
        
        resp.status(200).json({ 
            status: true, 
            msg: "Login credentials saved successfully",
            doc: savedDoc
        });
    } catch (error) {
        console.error("Error saving login credentials:", error);
        resp.status(500).json({ 
            status: false, 
            msg: "An error occurred while saving login credentials" 
        });
    }
});


app.get("/validatelogin", async (req, resp) => {
    const { username, password } = req.query;

    if (!username || !password) {
        return resp.status(400).json({ status: false, msg: "Username and password are required" });
    }

    try {
        const user = await LoginRef.findOne({ user: username });

        if (!user) {
            return resp.status(404).json({ status: false, msg: "User not found" });
        }

        if (user.pwd === password) {
            resp.status(200).json({ 
                status: true, 
                msg: "Login successful",
                role: user.role 
            });
        } else {
            resp.status(401).json({ status: false, msg: "Invalid credentials" });
        }
    } catch (error) {
        console.error("Login validation error:", error);
        resp.status(500).json({ status: false, msg: "Internal server error" });
    }
});

app.post("/savesales", async (req, resp) => {
    try {
        const { sales, customers } = req.body;
        
        const salesDoc = new SalesRef({
            sales: sales,
            customers: customers
        });

        const savedDoc = await salesDoc.save();
        resp.status(200).json({ 
            status: true, 
            msg: "Sales data saved successfully",
            doc: savedDoc
        });
    } catch (error) {
        console.error("Error saving sales data:", error);
        resp.status(500).json({ 
            status: false, 
            msg: "Error saving sales data" 
        });
    }
});


app.get("/saleshistory", async (req, resp) => {
    try {
        const { from, to } = req.query;
        const startDate = new Date(from);
        const endDate = new Date(to);
        endDate.setHours(23, 59, 59, 999); // Include the entire end date

        const sales = await SalesRef.find({
            date: {
                $gte: startDate,
                $lte: endDate
            }
        }).sort({ date: 1 });

        resp.status(200).json({
            status: true,
            data: sales
        });
    } catch (error) {
        console.error("Error fetching sales history:", error);
        resp.status(500).json({
            status: false,
            msg: "Error fetching sales history"
        });
    }
});

app.get("/totalsales", async (req, resp) => {
    try {
        const { from, to } = req.query;
        const startDate = new Date(from);
        const endDate = new Date(to);
        endDate.setHours(23, 59, 59, 999);

        const result = await SalesRef.aggregate([
            {
                $match: {
                    date: {
                        $gte: startDate,
                        $lte: endDate
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: "$sales" },
                    totalCustomers: { $sum: "$customers" }
                }
            }
        ]);

        const totals = result[0] || { totalSales: 0, totalCustomers: 0 };

        resp.status(200).json({
            status: true,
            data: totals
        });
    } catch (error) {
        console.error("Error calculating total sales:", error);
        resp.status(500).json({
            status: false,
            msg: "Error calculating total sales"
        });
    }
});

// Add this new endpoint to your existing server.js file
app.post("/updatepassword", async (req, resp) => {
    const { email, currentPassword, newPassword } = req.body;

    if (!email || !currentPassword || !newPassword) {
        return resp.status(400).json({
            status: false,
            msg: "All fields are required"
        });
    }

    try {
        // Find the user
        const user = await LoginRef.findOne({ user: email });

        if (!user) {
            return resp.status(404).json({
                status: false,
                msg: "User not found"
            });
        }

        // Check if current password matches
        if (user.pwd !== currentPassword) {
            return resp.status(401).json({
                status: false,
                msg: "Current password is incorrect"
            });
        }

        // Update the password
        const updatedUser = await LoginRef.findOneAndUpdate(
            { user: email },
            { $set: { pwd: newPassword } },
            { new: true }
        );

        resp.status(200).json({
            status: true,
            msg: "Password updated successfully"
        });
    } catch (error) {
        console.error("Error updating password:", error);
        resp.status(500).json({
            status: false,
            msg: "An error occurred while updating password"
        });
    }
});


// Add this new endpoint to your existing server.js
app.get("/chartdata", async (req, resp) => {
    try {
        // Get data for the last 7 days
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);

        const salesData = await SalesRef.aggregate([
            {
                $match: {
                    date: {
                        $gte: startDate,
                        $lte: endDate
                    }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$date" }
                    },
                    totalSales: { $sum: "$sales" },
                    totalCustomers: { $sum: "$customers" }
                }
            },
            {
                $sort: { "_id": 1 }
            }
        ]);

        // Calculate average sales per customer
        const enrichedData = salesData.map(day => ({
            date: day._id,
            sales: day.totalSales,
            customers: day.totalCustomers,
            averagePerCustomer: (day.totalSales / day.totalCustomers).toFixed(2)
        }));

        resp.status(200).json({
            status: true,
            data: enrichedData
        });
    } catch (error) {
        console.error("Error fetching chart data:", error);
        resp.status(500).json({
            status: false,
            msg: "Error fetching chart data"
        });
    }
});

// Add these new endpoints to your existing server.js

// Endpoint for sales distribution by day of week
app.get("/salesbyday", async (req, resp) => {
    try {
        const salesData = await SalesRef.aggregate([
            {
                $group: {
                    _id: { $dayOfWeek: "$date" },
                    totalSales: { $sum: "$sales" }
                }
            },
            {
                $project: {
                    day: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$_id", 1] }, then: "Sunday" },
                                { case: { $eq: ["$_id", 2] }, then: "Monday" },
                                { case: { $eq: ["$_id", 3] }, then: "Tuesday" },
                                { case: { $eq: ["$_id", 4] }, then: "Wednesday" },
                                { case: { $eq: ["$_id", 5] }, then: "Thursday" },
                                { case: { $eq: ["$_id", 6] }, then: "Friday" },
                                { case: { $eq: ["$_id", 7] }, then: "Saturday" }
                            ]
                        }
                    },
                    value: "$totalSales"
                }
            },
            {
                $sort: { "_id": 1 }
            }
        ]);

        resp.status(200).json({
            status: true,
            data: salesData
        });
    } catch (error) {
        console.error("Error fetching sales by day data:", error);
        resp.status(500).json({
            status: false,
            msg: "Error fetching sales by day data"
        });
    }
});

// Endpoint for customer distribution
app.get("/customerdistribution", async (req, resp) => {
    try {
        const currentDate = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const customerData = await SalesRef.aggregate([
            {
                $match: {
                    date: {
                        $gte: thirtyDaysAgo,
                        $lte: currentDate
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    totalCustomers: { $sum: "$customers" },
                    data: {
                        $push: {
                            customers: "$customers",
                            date: "$date"
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    segments: [
                        {
                            name: "High Traffic (>50)",
                            value: {
                                $size: {
                                    $filter: {
                                        input: "$data",
                                        as: "item",
                                        cond: { $gt: ["$$item.customers", 50] }
                                    }
                                }
                            }
                        },
                        {
                            name: "Medium Traffic (20-50)",
                            value: {
                                $size: {
                                    $filter: {
                                        input: "$data",
                                        as: "item",
                                        cond: { 
                                            $and: [
                                                { $gte: ["$$item.customers", 20] },
                                                { $lte: ["$$item.customers", 50] }
                                            ]
                                        }
                                    }
                                }
                            }
                        },
                        {
                            name: "Low Traffic (<20)",
                            value: {
                                $size: {
                                    $filter: {
                                        input: "$data",
                                        as: "item",
                                        cond: { $lt: ["$$item.customers", 20] }
                                    }
                                }
                            }
                        }
                    ]
                }
            }
        ]);

        resp.status(200).json({
            status: true,
            data: customerData[0]?.segments || []
        });
    } catch (error) {
        console.error("Error fetching customer distribution:", error);
        resp.status(500).json({
            status: false,
            msg: "Error fetching customer distribution"
        });
    }
});

// Add this new endpoint for filtered chart data
app.get("/filteredchartdata", async (req, resp) => {
    try {
        const { startDate, endDate } = req.query;
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const salesData = await SalesRef.aggregate([
            {
                $match: {
                    date: {
                        $gte: start,
                        $lte: end
                    }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$date" }
                    },
                    totalSales: { $sum: "$sales" },
                    totalCustomers: { $sum: "$customers" }
                }
            },
            {
                $sort: { "_id": 1 }
            }
        ]);

        const enrichedData = salesData.map(day => ({
            date: day._id,
            sales: day.totalSales,
            customers: day.totalCustomers,
            averagePerCustomer: (day.totalSales / day.totalCustomers).toFixed(2)
        }));

        resp.status(200).json({
            status: true,
            data: enrichedData
        });
    } catch (error) {
        console.error("Error fetching filtered chart data:", error);
        resp.status(500).json({
            status: false,
            msg: "Error fetching filtered chart data"
        });
    }
});

app.get("/filteredsalesbyday", async (req, resp) => {
    try {
        const { startDate, endDate } = req.query;
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const salesData = await SalesRef.aggregate([
            {
                $match: {
                    date: {
                        $gte: start,
                        $lte: end
                    }
                }
            },
            {
                $group: {
                    _id: { $dayOfWeek: "$date" },
                    totalSales: { $sum: "$sales" }
                }
            },
            {
                $project: {
                    day: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$_id", 1] }, then: "Sunday" },
                                { case: { $eq: ["$_id", 2] }, then: "Monday" },
                                { case: { $eq: ["$_id", 3] }, then: "Tuesday" },
                                { case: { $eq: ["$_id", 4] }, then: "Wednesday" },
                                { case: { $eq: ["$_id", 5] }, then: "Thursday" },
                                { case: { $eq: ["$_id", 6] }, then: "Friday" },
                                { case: { $eq: ["$_id", 7] }, then: "Saturday" }
                            ]
                        }
                    },
                    value: "$totalSales"
                }
            },
            {
                $sort: { "_id": 1 }
            }
        ]);

        resp.status(200).json({
            status: true,
            data: salesData
        });
    } catch (error) {
        console.error("Error fetching filtered sales by day data:", error);
        resp.status(500).json({
            status: false,
            msg: "Error fetching filtered sales by day data"
        });
    }
});

app.get("/filteredcustomerdistribution", async (req, resp) => {
    try {
        const { startDate, endDate } = req.query;
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const customerData = await SalesRef.aggregate([
            {
                $match: {
                    date: {
                        $gte: start,
                        $lte: end
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    totalCustomers: { $sum: "$customers" },
                    data: {
                        $push: {
                            customers: "$customers",
                            date: "$date"
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    segments: [
                        {
                            name: "High Traffic (>50)",
                            value: {
                                $size: {
                                    $filter: {
                                        input: "$data",
                                        as: "item",
                                        cond: { $gt: ["$$item.customers", 50] }
                                    }
                                }
                            }
                        },
                        {
                            name: "Medium Traffic (20-50)",
                            value: {
                                $size: {
                                    $filter: {
                                        input: "$data",
                                        as: "item",
                                        cond: { 
                                            $and: [
                                                { $gte: ["$$item.customers", 20] },
                                                { $lte: ["$$item.customers", 50] }
                                            ]
                                        }
                                    }
                                }
                            }
                        },
                        {
                            name: "Low Traffic (<20)",
                            value: {
                                $size: {
                                    $filter: {
                                        input: "$data",
                                        as: "item",
                                        cond: { $lt: ["$$item.customers", 20] }
                                    }
                                }
                            }
                        }
                    ]
                }
            }
        ]);

        resp.status(200).json({
            status: true,
            data: customerData[0]?.segments || []
        });
    } catch (error) {
        console.error("Error fetching filtered customer distribution:", error);
        resp.status(500).json({
            status: false,
            msg: "Error fetching filtered customer distribution"
        });
    }
});