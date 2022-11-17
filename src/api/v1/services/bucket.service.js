
import AWS from "aws-sdk";


export default class BucketService {

    static async uploadFile(file, bucketName) {
        const s3 = new AWS.S3();
        
        const params = {
        Bucket: bucketName,
        Key: file.originalname,
        Body: file.buffer,
        ACL: "public-read",
        };
        
        return s3.upload(params).promise();
    }
    
    static async deleteFile(key, bucketName) {
        const s3 = new AWS.S3();
        const params = {
        Bucket: bucketName,
        Key: key,
        };
        return s3.deleteObject(params).promise();
    }
    }


