import dotenv from 'dotenv'
import connetToDB from "./db/index.js";

dotenv.config({ path: './env'})

connetToDB();


// ;(async () => {
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
//         app.on('error', (error) => {
//             console.log('Error while talking with database: ', error);
//             throw error;
//         })
//         app.listen(process.env.PORT, () => {
//             console.log('App is listening')
//         })
//     } 
//     catch(error) {
//         console.log('Error while connecting the database: ', error)
//         throw error;
//     }
// })()