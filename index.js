const express = require('express');
const { google } = require('googleapis');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const dotenv = require('dotenv').config();
const fs = require('fs');


const app = express();
app.use(express.json());
app.listen(3456, () => console.log("Server Running on Port 3456"));




const authentication = async () => {
    const auth = new google.auth.GoogleAuth({
        keyFile: "credentials.json",
        scopes: "https://www.googleapis.com/auth/spreadsheets"
    });

    const client = await auth.getClient();

    const sheets = google.sheets({
        version: 'v4',
        auth: client
    });
    return { sheets }
};

const id = '1WucLkGLXbztB4ZI3vdniM2GkZJaKqBLeEPfy4yrRJIY';

app.get('/', async (req, res) => {
    try {
        const { sheets } = await authentication();
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: id,
            range: 'EMPLOYEE LIST'
        });
        res.send(response.data);
        concatResponse(response.data);
    } catch (error) {
        console.log("Error here in /", error)
        res.status(500).send();
    }
});


let newList = [];
let teamLeaders = ['Nimit Shawnak Shah', 'Patel Jenishkumar Nimeshbhai', 'Bhatti Gulabkumar M', 'Mihir Kiritbhai Pipermitwala', 'MANSIBEN BHARATBHAI KIKANI', 'Sameer Kirankumar Vaghela'];
let totalTeam = 6;
let splittedTeamMembers = [];
const concatResponse = async (data) => {
    let allMembersWithoutLeaders = await data.values.filter((eachMember, index) => {
        if (index !== 0) {
            // if (teamLeaders.filter((eachLeader) => eachLeader !== eachMember[1])) {
            newList.push(eachMember[1]);
            // }
        }
    });
    let shuffledArray = await shuffleMembers(newList);
    let splittedMembers = await splitMembers(shuffledArray);
    // console.log("splitted members", splittedTeamMembers);
    await writeTeamsToSheet(splittedTeamMembers);
};

const shuffleMembers = (allMembers) => {
    for (var i = allMembers.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = allMembers[i];
        allMembers[i] = allMembers[j];
        allMembers[j] = temp;
    }
    return allMembers;
};

const splitMembers = async (allMembers) => {
    allMembers = allMembers.filter((el) => !teamLeaders.includes(el));
    //Above line remove leaders from all members
    let totalMembers = allMembers.length;
    let eachMemberInTeam = Math.ceil(totalMembers / teamLeaders.length);
    const chunkSize = eachMemberInTeam;
    for (let i = 0; i < allMembers.length; i += chunkSize) {
        const chunk = allMembers.slice(i, i + chunkSize);
        // do whatever
        // console.log("each Team", chunk)
        splittedTeamMembers.push(chunk);
    }
    return;
};

//Code Can read all members from Employee List and split them into 6 groups
// Use node version 14

const writeTeamsToSheet = async (splittedTeamMembers) => {
    // console.log("splittedTeamMembers", splittedTeamMembers)
    splittedTeamMembers.filter((eachTeam, index) => {
        eachTeam.splice(0, 0, teamLeaders[index]);
        return;
    })
    // console.log("Each team", splittedTeamMembers)
    fs.writeFileSync('team.json', JSON.stringify(splittedTeamMembers))
    try {
        const { sheets } = await authentication();
        // splittedTeamMembers.map(async (eachTeam) => {
        const writeRequest = await sheets.spreadsheets.values.append({
            spreadsheetId: id,
            range: 'Check',
            valueInputOption: 'RAW',
            resource: {
                values: splittedTeamMembers,
            }
        })
        if (writeRequest.status === 200) {
            console.log("Date wrote successfully")
        }
        // })
    } catch (error) {
        console.log("Error here 789: ", error)
    }
};