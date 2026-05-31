const { Resend } = require("resend");
const { env } = require("../config");
const { ApiError } = require("./api-error");

let resend;

const getResendClient = () => {
  if (!env.RESEND_API_KEY) {
    throw new ApiError(500, "Email service is not configured");
  }

  if (!resend) {
    resend = new Resend(env.RESEND_API_KEY);
  }

  return resend;
};

const sendMail = async (mailOptions) => {
  const { error } = await getResendClient().emails.send(mailOptions);
  if (error) {
    throw new ApiError(500, "Unable to send email");
  }
};

module.exports = {
  sendMail,
};
