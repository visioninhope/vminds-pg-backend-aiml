require("dotenv").config();
const express = require("express");
const path = require("path");
const authRoutes = require("./routes/authRoutes");
const pointRoutes = require("./routes/pointRoutes");
const chatRoutes = require("./routes/modelsRoutes");
const dataRoutes = require("./routes/dataRoutes");
const reportRoutes = require("./routes/reportRoutes");
const tokensRoutes = require("./routes/tokensRoutes");
const paymentRoutes = require('./routes/paymentRoutes');
const packageRoutes = require('./routes/packageRoutes');
const callbackRoutes = require('./routes/callbackRoutes');
const PT2Routes = require('./routes/PT2Routes');
const uiDataRoutes = require('./routes/uiDataRoutes');


require("./utils/streakResetter");
require("./utils/consecutiveResseter");
require("./utils/resetTokensUsed");

const authenticate = require("./middlewares/authenticate");

const app = express();

app.use('/images', express.static(path.join(__dirname, 'images')));


app.use(express.json());
app.use(express.urlencoded({ extended: true })); 

app.use("/api/vminds/auth", authRoutes);
app.use("/api/vminds/points", authenticate, pointRoutes);
app.use("/api/vminds/models", authenticate, chatRoutes);
app.use("/api/vminds/data", dataRoutes);
app.use("/api/vminds/support", authenticate, reportRoutes);
app.use("/api/vminds/tokens", authenticate, tokensRoutes);
app.use("/api/vminds/packages", packageRoutes);
app.use('/api/vminds/payment', authenticate, paymentRoutes);
app.use('/api/vminds/call', callbackRoutes);
app.use('/api/vminds/PT2', authenticate, PT2Routes);
app.use('/api/vminds/UI-Data', authenticate, uiDataRoutes);



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
