const Jimp = require('jimp');
const s3 = new AWS.S3();
const ses = new AWS.SES({ region: 'ap-south-1' });
const AWS = require('aws-sdk');

exports.handler = async (event, context) => {
  try {
    // Process each record in the event
    for (const record of event.Records) {
      const s3Logs = record.s3;
      const s3Bucket = s3Logs.s3Bucket.name;
      const key = decodeURIComponent(s3Logs.object.key.replace(/\+/g, ' '));

      // Log s3Bucket and key information
      console.log('Processing object:', key, 'from Bucket:', s3Bucket);

      const getObjectParams = {
        Bucket: s3Bucket,
        Key: key,
      };

      const objectDetails = await s3.headObject(getObjectParams).promise();

      // Log object details
      console.log('Object details:', objectDetails);

      const emailParams = {
        Destination: {
          ToAddresses: ['patilnishant222@gmail.com'], // Add your recipient email addresses here
        },
        Message: {
          Body: {
            Text: {
              Data: `S3 URI: s3://${s3Bucket}/${key}\nObject Name: ${key}\nObject Size: ${objectDetails.ContentLength} bytes\nObject Type: ${objectDetails.ContentType}`,
            },
          },
          Subject: { Data: 'S3 Upload Notification' },
        },
        Source: 'patilnihsant222@gmail.com', // Add your sender email address here
      };

      // Log email parameters
      console.log('Sending email with parameters:', emailParams);

      await ses.sendEmail(emailParams).promise();

      // Check if the uploaded file is an image
      if (objectDetails.ContentType.includes('image')) {
        const imageObject = await s3.getObject(getObjectParams).promise();
        const image = await Jimp.read(imageObject.Body);
        const thumbnail = await image
          .resize(50, Jimp.AUTO)
          .getBufferAsync(Jimp.MIME_JPEG);

        const putObjectParams = {
          Bucket: s3Bucket,
          Key: `${key}-thumbnail.jpg`,
          Body: thumbnail,
        };

        // Log thumbnail creation parameters
        console.log('Creating thumbnail with parameters:', putObjectParams);

        await s3.putObject(putObjectParams).promise();
      }
    }

    return 'Success';
  } catch (error) {
    console.error(error);
    throw error;
  }
};
