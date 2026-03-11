function clickButton(event) {
    console.log("button clicked outer",event.outer);
    console.log("button clicked inner",event.inner);
    document.getElementById("submitbutton").click();
    document.getElementById("participentname").addEventListener('click',clickButton());
    document.getElementById("password").addEventListener('click',clickButton());

}
const obj = new Object();
obj.outer = "outer value";
obj.inner = "inner value";
function details(name , password) {
    console.log("details function called");
    this.name = name;
    this.password = password;
    console.log("name:",this.name);
    console.log("password:",this.password);
}
Object.keys(details.prototype).forEach(function(key) {
    console.log("Prototype key:", key); });

    Object.keys(obj);

function personInfo(age,gender ,euye) {
    console.log("personInfo function called");
    this.age = age;
    this.gender = gender;
    this.euye = euye;}
    let person1 = new personInfo(18,"male","white");
    let person2 = new personInfo(20,"male","skinny");

    personInfo.prototype.bodyType = "Athletic";
    personInfo.prototype.getbodyType = function() {
        return this.bodyType; };
        personInfo.prototype.getdetails = function() {
        // console.log.log("Age:", this.age);
        // console.log.log("Gender:", this.gender);
        // console.log.log("Eye Color:", this.euye);
        console.log(person1);
        console.log(person2);
        
        }

    console.log("person1 body type:", person1.getbodyType());
    console.log("person2 body type:", person2.getbodyType());

    let arr = Array(5,5,6,7,8);
    arr.map((value,index)=>{
        console.log("Array value:",value);
        console.log("Array index:",index);
    });
    arr.fill(10,0,5);
    console.log("Array of 5:", arr);
    let strarr = Array("apple","banana","cherry");
    strarr.forEach((value,index)=>{
        console.log("String Array value:",value);
        console.log("String Array index:",index);
    });
    strarr.reverse();
    console.log("Reversed String Array:", strarr);
    strarr.sort();
    console.log("Sorted String Array:", strarr);
    strarr.concat(arr);
    console.log("Concatenated String Array:", strarr);

window.alert("Welcome to the Registration Page!");

let inputName = window.prompt("Please enter your name:");
document.write("Hello, " + inputName + "! Welcome to our website.");

let confirmAction = window.confirm("Do you want to proceed?");
if (confirmAction) {
    document.write("You chose to proceed.");
} else {
    document.write("You canceled the action.");
}


let jsonStr = '{"name":"Hyundai Creta","model":2024,"fuel":"Diesel"}';

let car = JSON.parse(jsonStr);

console.log(car.name);   // Hyundai Creta
console.log(car.model);  // 2024
console.log(car.fuel);   // Diesel


let jsonArr = '[1, 2, 3, 4]';

let numbers = JSON.parse(jsonArr);

console.log(numbers[0]); // 1
console.log(numbers[1]); // 2
console.log(numbers[2]); // 3
console.log(numbers[3]); // 4


function getdata() {
    fetch('https://jsonplaceholder.typicode.com/posts/1')
    .then(response => response.json())
    .then(data => {
        console.log('Title:', data.title);
        console.log('Body:', data.body);
    })
    .catch(error => console.error('Error fetching data:', error));
}
getdata();

function postdata() {
    const postData = {
        title: 'foo',
        body: 'bar',
        userId: 1,
    };
    fetch('https://jsonplaceholder.typicode.com/posts', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
    })
    .then(response => response.json())
    .then(data => console.log('Post created:', data))
    .catch(error => console.error('Error creating post:', error));
    
}   

const detailsooj = new details("user1","pass1");

document.getElementById("submitbutton").addEventListener('click',clickButton.bind(obj));

document.getElementById("registrationForm").addEventListener("submit", registerUser);
function registerUser(event) {
    event.preventDefault();
    const name = document.getElementById("participantname").value;
    const password = document.getElementById("password").value;
    console.log("Registering user:", name, password);
}