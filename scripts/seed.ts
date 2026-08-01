import { config } from "dotenv";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import * as schema from "../db/schema";

// Mirror Next.js's own env precedence — see drizzle.config.ts for why.
config({ path: ".env" });
config({ path: ".env.local", override: true });

const client = createClient({ url: `file:${process.env.DATABASE_URL || "./sqlite.db"}` });
void client.execute("PRAGMA foreign_keys = ON");
const db = drizzle(client, { schema });

const main = async () => {
  try {
    console.log("Seeding database");

    // Clear tables
    await db.delete(schema.courses);
    await db.delete(schema.userProgress);
    await db.delete(schema.units);
    await db.delete(schema.lessons);
    await db.delete(schema.challenges);
    await db.delete(schema.challengeOptions);
    await db.delete(schema.challengeProgress);
    await db.delete(schema.userSubscription);

    // Insert courses — coding-focused catalog
    await db.insert(schema.courses).values([
      { id: 1, title: "Python Fundamentals", imageSrc: "/python.svg" },
      { id: 2, title: "JavaScript Basics", imageSrc: "/javascript.svg" },
      { id: 3, title: "Web Development", imageSrc: "/webdev.svg" },
      { id: 4, title: "SQL & Databases", imageSrc: "/sql.svg" },
      { id: 5, title: "Java Fundamentals", imageSrc: "/java.svg" },
    ]);

    // Insert units for each course
    await db.insert(schema.units).values([
      // Python Fundamentals
      { id: 1, courseId: 1, title: "Getting Started", description: "Variables, print, and data types", order: 1 },
      { id: 2, courseId: 1, title: "Control Flow", description: "Conditionals and loops", order: 2 },

      // JavaScript Basics
      { id: 3, courseId: 2, title: "JS Fundamentals", description: "Variables, functions, arrays, and objects", order: 1 },
      { id: 4, courseId: 2, title: "Working with the DOM", description: "Selecting elements and handling events", order: 2 },

      // Web Development
      { id: 5, courseId: 3, title: "HTML Essentials", description: "Structure, tags, forms, and links", order: 1 },
      { id: 6, courseId: 3, title: "CSS Styling", description: "Selectors, properties, and flexbox layout", order: 2 },

      // SQL & Databases
      { id: 7, courseId: 4, title: "SQL Basics", description: "Querying and filtering data", order: 1 },
      { id: 8, courseId: 4, title: "Working with Tables", description: "Joins and aggregate functions", order: 2 },

      // Java Fundamentals
      { id: 9, courseId: 5, title: "Getting Started", description: "Variables, types, and output", order: 1 },
      { id: 10, courseId: 5, title: "Control Flow", description: "Conditionals and loops", order: 2 },
    ]);

    // Insert lessons (2 per unit)
    await db.insert(schema.lessons).values([
      // Python - Getting Started
      { id: 1, unitId: 1, order: 1, title: "Variables & Print" },
      { id: 2, unitId: 1, order: 2, title: "Data Types" },

      // Python - Control Flow
      { id: 3, unitId: 2, order: 1, title: "Conditionals" },
      { id: 4, unitId: 2, order: 2, title: "Loops" },

      // JavaScript - Fundamentals
      { id: 5, unitId: 3, order: 1, title: "Variables & Functions" },
      { id: 6, unitId: 3, order: 2, title: "Arrays & Objects" },

      // JavaScript - DOM
      { id: 7, unitId: 4, order: 1, title: "Selecting Elements" },
      { id: 8, unitId: 4, order: 2, title: "Handling Events" },

      // Web Dev - HTML
      { id: 9, unitId: 5, order: 1, title: "Structure & Tags" },
      { id: 10, unitId: 5, order: 2, title: "Forms & Links" },

      // Web Dev - CSS
      { id: 11, unitId: 6, order: 1, title: "Selectors & Properties" },
      { id: 12, unitId: 6, order: 2, title: "Flexbox Layout" },

      // SQL - Basics
      { id: 13, unitId: 7, order: 1, title: "SELECT Queries" },
      { id: 14, unitId: 7, order: 2, title: "Filtering with WHERE" },

      // SQL - Tables
      { id: 15, unitId: 8, order: 1, title: "JOINs" },
      { id: 16, unitId: 8, order: 2, title: "Aggregate Functions" },

      // Java - Getting Started
      { id: 17, unitId: 9, order: 1, title: "Variables & Types" },
      { id: 18, unitId: 9, order: 2, title: "Print & Output" },

      // Java - Control Flow
      { id: 19, unitId: 10, order: 1, title: "Conditionals" },
      { id: 20, unitId: 10, order: 2, title: "Loops" },
    ]);

    // Insert challenges — 4 real questions per lesson
    await db.insert(schema.challenges).values([
      // 1 Variables & Print (Python)
      { id: 1, lessonId: 1, type: "SELECT", order: 1, question: "How do you print \"Hello, World!\" in Python?" },
      { id: 2, lessonId: 1, type: "SELECT", order: 2, question: "Which of these is a valid Python variable name?" },
      { id: 3, lessonId: 1, type: "SELECT", order: 3, question: "What symbol starts a comment in Python?" },
      { id: 4, lessonId: 1, type: "SELECT", order: 4, question: "Which function converts a string to an integer in Python?" },

      // 2 Data Types (Python)
      { id: 5, lessonId: 2, type: "SELECT", order: 1, question: "What data type is the value 3.14 in Python?" },
      { id: 6, lessonId: 2, type: "SELECT", order: 2, question: "What does type(\"hello\") return in Python?" },
      { id: 7, lessonId: 2, type: "SELECT", order: 3, question: "Which of these is a Python list?" },
      { id: 8, lessonId: 2, type: "SELECT", order: 4, question: "What is the boolean data type called in Python?" },

      // 3 Conditionals (Python)
      { id: 9, lessonId: 3, type: "SELECT", order: 1, question: "Which keyword starts a conditional block in Python?" },
      { id: 10, lessonId: 3, type: "SELECT", order: 2, question: "What is the correct Python syntax for an \"else if\"?" },
      { id: 11, lessonId: 3, type: "SELECT", order: 3, question: "Which operator checks for equality in Python?" },
      { id: 12, lessonId: 3, type: "SELECT", order: 4, question: "What does the \"not\" keyword do in Python?" },

      // 4 Loops (Python)
      { id: 13, lessonId: 4, type: "SELECT", order: 1, question: "Which loop is best for iterating a fixed number of times using range()?" },
      { id: 14, lessonId: 4, type: "SELECT", order: 2, question: "What does \"break\" do inside a loop?" },
      { id: 15, lessonId: 4, type: "SELECT", order: 3, question: "What does \"continue\" do inside a loop?" },
      { id: 16, lessonId: 4, type: "SELECT", order: 4, question: "Which loop keeps running while a condition is true?" },

      // 5 Variables & Functions (JS)
      { id: 17, lessonId: 5, type: "SELECT", order: 1, question: "Which keyword declares a variable that can be reassigned in JavaScript?" },
      { id: 18, lessonId: 5, type: "SELECT", order: 2, question: "How do you define a function in JavaScript?" },
      { id: 19, lessonId: 5, type: "SELECT", order: 3, question: "Which keyword declares a constant that cannot be reassigned?" },
      { id: 20, lessonId: 5, type: "SELECT", order: 4, question: "What does an arrow function look like in JavaScript?" },

      // 6 Arrays & Objects (JS)
      { id: 21, lessonId: 6, type: "SELECT", order: 1, question: "How do you access the first element of an array named arr?" },
      { id: 22, lessonId: 6, type: "SELECT", order: 2, question: "How do you access the \"name\" property of an object named person?" },
      { id: 23, lessonId: 6, type: "SELECT", order: 3, question: "Which method adds an item to the end of an array?" },
      { id: 24, lessonId: 6, type: "SELECT", order: 4, question: "How do you get the number of items in an array named arr?" },

      // 7 Selecting Elements (JS)
      { id: 25, lessonId: 7, type: "SELECT", order: 1, question: "Which method selects an element by its id?" },
      { id: 26, lessonId: 7, type: "SELECT", order: 2, question: "What does document.querySelector(\".card\") select?" },
      { id: 27, lessonId: 7, type: "SELECT", order: 3, question: "Which method selects ALL elements matching a CSS selector?" },
      { id: 28, lessonId: 7, type: "SELECT", order: 4, question: "How do you change the text content of an element named el?" },

      // 8 Handling Events (JS)
      { id: 29, lessonId: 8, type: "SELECT", order: 1, question: "Which method attaches a click handler to a button?" },
      { id: 30, lessonId: 8, type: "SELECT", order: 2, question: "What gives you details about the event that just occurred?" },
      { id: 31, lessonId: 8, type: "SELECT", order: 3, question: "Which event fires when a form is submitted?" },
      { id: 32, lessonId: 8, type: "SELECT", order: 4, question: "How do you prevent a form's default submission behavior?" },

      // 9 Structure & Tags (HTML)
      { id: 33, lessonId: 9, type: "SELECT", order: 1, question: "Which tag defines the largest heading in HTML?" },
      { id: 34, lessonId: 9, type: "SELECT", order: 2, question: "Which tag is used to create a hyperlink?" },
      { id: 35, lessonId: 9, type: "SELECT", order: 3, question: "Which tag is used for an unordered list?" },
      { id: 36, lessonId: 9, type: "SELECT", order: 4, question: "Which tag embeds an image in HTML?" },

      // 10 Forms & Links (HTML)
      { id: 37, lessonId: 10, type: "SELECT", order: 1, question: "Which input type creates a checkbox?" },
      { id: 38, lessonId: 10, type: "SELECT", order: 2, question: "Which attribute specifies where a link should open?" },
      { id: 39, lessonId: 10, type: "SELECT", order: 3, question: "Which attribute makes a form field required?" },
      { id: 40, lessonId: 10, type: "SELECT", order: 4, question: "Which tag creates a dropdown menu?" },

      // 11 Selectors & Properties (CSS)
      { id: 41, lessonId: 11, type: "SELECT", order: 1, question: "Which CSS selector targets all elements with class \"btn\"?" },
      { id: 42, lessonId: 11, type: "SELECT", order: 2, question: "Which property changes an element's text color?" },
      { id: 43, lessonId: 11, type: "SELECT", order: 3, question: "Which selector targets an element with id \"header\"?" },
      { id: 44, lessonId: 11, type: "SELECT", order: 4, question: "Which property controls the space inside an element's border?" },

      // 12 Flexbox Layout (CSS)
      { id: 45, lessonId: 12, type: "SELECT", order: 1, question: "Which property turns an element into a flex container?" },
      { id: 46, lessonId: 12, type: "SELECT", order: 2, question: "Which property aligns flex items along the main axis?" },
      { id: 47, lessonId: 12, type: "SELECT", order: 3, question: "Which property controls the direction flex items are laid out?" },
      { id: 48, lessonId: 12, type: "SELECT", order: 4, question: "Which property adds space between flex items?" },

      // 13 SELECT Queries (SQL)
      { id: 49, lessonId: 13, type: "SELECT", order: 1, question: "Which SQL keyword retrieves data from a table?" },
      { id: 50, lessonId: 13, type: "SELECT", order: 2, question: "Which clause specifies which table to query?" },
      { id: 51, lessonId: 13, type: "SELECT", order: 3, question: "How do you select all columns from a table?" },
      { id: 52, lessonId: 13, type: "SELECT", order: 4, question: "Which keyword removes duplicate rows from results?" },

      // 14 Filtering with WHERE (SQL)
      { id: 53, lessonId: 14, type: "SELECT", order: 1, question: "Which clause filters rows based on a condition?" },
      { id: 54, lessonId: 14, type: "SELECT", order: 2, question: "Which operator checks if a value is within a range?" },
      { id: 55, lessonId: 14, type: "SELECT", order: 3, question: "Which keyword combines conditions that must ALL be true?" },
      { id: 56, lessonId: 14, type: "SELECT", order: 4, question: "Which operator matches a pattern in text?" },

      // 15 JOINs (SQL)
      { id: 57, lessonId: 15, type: "SELECT", order: 1, question: "Which JOIN returns only matching rows from both tables?" },
      { id: 58, lessonId: 15, type: "SELECT", order: 2, question: "Which JOIN returns all rows from the left table, even without a match?" },
      { id: 59, lessonId: 15, type: "SELECT", order: 3, question: "Which clause specifies how two tables are related in a JOIN?" },
      { id: 60, lessonId: 15, type: "SELECT", order: 4, question: "What do you call a column used to uniquely identify a row?" },

      // 16 Aggregate Functions (SQL)
      { id: 61, lessonId: 16, type: "SELECT", order: 1, question: "Which function counts the number of rows?" },
      { id: 62, lessonId: 16, type: "SELECT", order: 2, question: "Which function calculates the average of a column?" },
      { id: 63, lessonId: 16, type: "SELECT", order: 3, question: "Which clause groups rows sharing a value for aggregation?" },
      { id: 64, lessonId: 16, type: "SELECT", order: 4, question: "Which clause filters groups after aggregation, unlike WHERE?" },

      // 17 Variables & Types (Java)
      { id: 65, lessonId: 17, type: "SELECT", order: 1, question: "Which keyword declares an integer variable in Java?" },
      { id: 66, lessonId: 17, type: "SELECT", order: 2, question: "Which type holds true/false values in Java?" },
      { id: 67, lessonId: 17, type: "SELECT", order: 3, question: "Which symbol ends a statement in Java?" },
      { id: 68, lessonId: 17, type: "SELECT", order: 4, question: "Which type is used for decimal numbers in Java?" },

      // 18 Print & Output (Java)
      { id: 69, lessonId: 18, type: "SELECT", order: 1, question: "Which statement prints text to the console in Java?" },
      { id: 70, lessonId: 18, type: "SELECT", order: 2, question: "What is the entry point method every Java program needs?" },
      { id: 71, lessonId: 18, type: "SELECT", order: 3, question: "How do you start a single-line comment in Java?" },
      { id: 72, lessonId: 18, type: "SELECT", order: 4, question: "In Java, the public class name must match the ___?" },

      // 19 Conditionals (Java)
      { id: 73, lessonId: 19, type: "SELECT", order: 1, question: "Which keyword starts a conditional block in Java?" },
      { id: 74, lessonId: 19, type: "SELECT", order: 2, question: "Which keyword provides an alternative when an if condition is false?" },
      { id: 75, lessonId: 19, type: "SELECT", order: 3, question: "Which statement lets you compare one variable against many possible values?" },
      { id: 76, lessonId: 19, type: "SELECT", order: 4, question: "Which operator checks if two values are NOT equal in Java?" },

      // 20 Loops (Java)
      { id: 77, lessonId: 20, type: "SELECT", order: 1, question: "Which loop is best when you know the exact number of iterations?" },
      { id: 78, lessonId: 20, type: "SELECT", order: 2, question: "Which loop always runs its body at least once?" },
      { id: 79, lessonId: 20, type: "SELECT", order: 3, question: "Which keyword exits a loop early in Java?" },
      { id: 80, lessonId: 20, type: "SELECT", order: 4, question: "Which keyword skips to the next loop iteration in Java?" },
    ]);

    // Insert options for all challenges (one correct + two incorrect per question)
    await db.insert(schema.challengeOptions).values([
      // 1
      { challengeId: 1, text: 'print("Hello, World!")', correct: true },
      { challengeId: 1, text: 'console.log("Hello, World!")', correct: false },
      { challengeId: 1, text: 'echo "Hello, World!"', correct: false },
      // 2
      { challengeId: 2, text: "my_age", correct: true },
      { challengeId: 2, text: "2nd_place", correct: false },
      { challengeId: 2, text: "my-age", correct: false },
      // 3
      { challengeId: 3, text: "#", correct: true },
      { challengeId: 3, text: "//", correct: false },
      { challengeId: 3, text: "/* */", correct: false },
      // 4
      { challengeId: 4, text: "int()", correct: true },
      { challengeId: 4, text: "str()", correct: false },
      { challengeId: 4, text: "list()", correct: false },

      // 5
      { challengeId: 5, text: "float", correct: true },
      { challengeId: 5, text: "int", correct: false },
      { challengeId: 5, text: "str", correct: false },
      // 6
      { challengeId: 6, text: "<class 'str'>", correct: true },
      { challengeId: 6, text: "<class 'int'>", correct: false },
      { challengeId: 6, text: "<class 'list'>", correct: false },
      // 7
      { challengeId: 7, text: "[1, 2, 3]", correct: true },
      { challengeId: 7, text: "(1, 2, 3)", correct: false },
      { challengeId: 7, text: "1, 2, 3", correct: false },
      // 8
      { challengeId: 8, text: "bool", correct: true },
      { challengeId: 8, text: "boolean", correct: false },
      { challengeId: 8, text: "Bool", correct: false },

      // 9
      { challengeId: 9, text: "if", correct: true },
      { challengeId: 9, text: "when", correct: false },
      { challengeId: 9, text: "check", correct: false },
      // 10
      { challengeId: 10, text: "elif", correct: true },
      { challengeId: 10, text: "else if", correct: false },
      { challengeId: 10, text: "elseif", correct: false },
      // 11
      { challengeId: 11, text: "==", correct: true },
      { challengeId: 11, text: "=", correct: false },
      { challengeId: 11, text: "equals", correct: false },
      // 12
      { challengeId: 12, text: "Reverses a boolean value", correct: true },
      { challengeId: 12, text: "Combines two conditions", correct: false },
      { challengeId: 12, text: "Checks membership in a list", correct: false },

      // 13
      { challengeId: 13, text: "for", correct: true },
      { challengeId: 13, text: "while", correct: false },
      { challengeId: 13, text: "repeat", correct: false },
      // 14
      { challengeId: 14, text: "Exits the loop immediately", correct: true },
      { challengeId: 14, text: "Skips to the next iteration", correct: false },
      { challengeId: 14, text: "Restarts the loop", correct: false },
      // 15
      { challengeId: 15, text: "Skips to the next iteration", correct: true },
      { challengeId: 15, text: "Exits the loop immediately", correct: false },
      { challengeId: 15, text: "Restarts the loop", correct: false },
      // 16
      { challengeId: 16, text: "while", correct: true },
      { challengeId: 16, text: "for", correct: false },
      { challengeId: 16, text: "loop", correct: false },

      // 17
      { challengeId: 17, text: "let", correct: true },
      { challengeId: 17, text: "const", correct: false },
      { challengeId: 17, text: "final", correct: false },
      // 18
      { challengeId: 18, text: "function greet() {}", correct: true },
      { challengeId: 18, text: "def greet():", correct: false },
      { challengeId: 18, text: "func greet() {}", correct: false },
      // 19
      { challengeId: 19, text: "const", correct: true },
      { challengeId: 19, text: "let", correct: false },
      { challengeId: 19, text: "var", correct: false },
      // 20
      { challengeId: 20, text: "() => {}", correct: true },
      { challengeId: 20, text: "() -> {}", correct: false },
      { challengeId: 20, text: "function => ()", correct: false },

      // 21
      { challengeId: 21, text: "arr[0]", correct: true },
      { challengeId: 21, text: "arr[1]", correct: false },
      { challengeId: 21, text: "arr.first()", correct: false },
      // 22
      { challengeId: 22, text: "person.name", correct: true },
      { challengeId: 22, text: "person->name", correct: false },
      { challengeId: 22, text: "person::name", correct: false },
      // 23
      { challengeId: 23, text: "push()", correct: true },
      { challengeId: 23, text: "add()", correct: false },
      { challengeId: 23, text: "append()", correct: false },
      // 24
      { challengeId: 24, text: "arr.length", correct: true },
      { challengeId: 24, text: "arr.size()", correct: false },
      { challengeId: 24, text: "arr.count", correct: false },

      // 25
      { challengeId: 25, text: "document.getElementById()", correct: true },
      { challengeId: 25, text: "document.getClassName()", correct: false },
      { challengeId: 25, text: "document.querySelectorId()", correct: false },
      // 26
      { challengeId: 26, text: "The first element with class \"card\"", correct: true },
      { challengeId: 26, text: "All elements with class \"card\"", correct: false },
      { challengeId: 26, text: "The element with id \"card\"", correct: false },
      // 27
      { challengeId: 27, text: "document.querySelectorAll()", correct: true },
      { challengeId: 27, text: "document.getElementById()", correct: false },
      { challengeId: 27, text: "document.querySelector()", correct: false },
      // 28
      { challengeId: 28, text: 'el.textContent = "new text"', correct: true },
      { challengeId: 28, text: 'el.text = "new text"', correct: false },
      { challengeId: 28, text: 'el.value = "new text"', correct: false },

      // 29
      { challengeId: 29, text: 'button.addEventListener("click", fn)', correct: true },
      { challengeId: 29, text: "button.onClick = fn()", correct: false },
      { challengeId: 29, text: "button.click(fn)", correct: false },
      // 30
      { challengeId: 30, text: "The event object", correct: true },
      { challengeId: 30, text: "The window object", correct: false },
      { challengeId: 30, text: "The document object", correct: false },
      // 31
      { challengeId: 31, text: "submit", correct: true },
      { challengeId: 31, text: "send", correct: false },
      { challengeId: 31, text: "post", correct: false },
      // 32
      { challengeId: 32, text: "event.preventDefault()", correct: true },
      { challengeId: 32, text: "event.stop()", correct: false },
      { challengeId: 32, text: "event.cancel()", correct: false },

      // 33
      { challengeId: 33, text: "<h1>", correct: true },
      { challengeId: 33, text: "<h6>", correct: false },
      { challengeId: 33, text: "<head>", correct: false },
      // 34
      { challengeId: 34, text: "<a>", correct: true },
      { challengeId: 34, text: "<link>", correct: false },
      { challengeId: 34, text: "<href>", correct: false },
      // 35
      { challengeId: 35, text: "<ul>", correct: true },
      { challengeId: 35, text: "<ol>", correct: false },
      { challengeId: 35, text: "<list>", correct: false },
      // 36
      { challengeId: 36, text: "<img>", correct: true },
      { challengeId: 36, text: "<image>", correct: false },
      { challengeId: 36, text: "<pic>", correct: false },

      // 37
      { challengeId: 37, text: '<input type="checkbox">', correct: true },
      { challengeId: 37, text: '<input type="check">', correct: false },
      { challengeId: 37, text: "<checkbox>", correct: false },
      // 38
      { challengeId: 38, text: "target", correct: true },
      { challengeId: 38, text: "open", correct: false },
      { challengeId: 38, text: "dest", correct: false },
      // 39
      { challengeId: 39, text: "required", correct: true },
      { challengeId: 39, text: "mandatory", correct: false },
      { challengeId: 39, text: "must", correct: false },
      // 40
      { challengeId: 40, text: "<select>", correct: true },
      { challengeId: 40, text: "<dropdown>", correct: false },
      { challengeId: 40, text: "<option>", correct: false },

      // 41
      { challengeId: 41, text: ".btn", correct: true },
      { challengeId: 41, text: "#btn", correct: false },
      { challengeId: 41, text: "*btn", correct: false },
      // 42
      { challengeId: 42, text: "color", correct: true },
      { challengeId: 42, text: "text-color", correct: false },
      { challengeId: 42, text: "font-color", correct: false },
      // 43
      { challengeId: 43, text: "#header", correct: true },
      { challengeId: 43, text: ".header", correct: false },
      { challengeId: 43, text: "*header", correct: false },
      // 44
      { challengeId: 44, text: "padding", correct: true },
      { challengeId: 44, text: "margin", correct: false },
      { challengeId: 44, text: "border", correct: false },

      // 45
      { challengeId: 45, text: "display: flex", correct: true },
      { challengeId: 45, text: "display: block", correct: false },
      { challengeId: 45, text: "position: flex", correct: false },
      // 46
      { challengeId: 46, text: "justify-content", correct: true },
      { challengeId: 46, text: "align-items", correct: false },
      { challengeId: 46, text: "text-align", correct: false },
      // 47
      { challengeId: 47, text: "flex-direction", correct: true },
      { challengeId: 47, text: "flex-flow", correct: false },
      { challengeId: 47, text: "direction", correct: false },
      // 48
      { challengeId: 48, text: "gap", correct: true },
      { challengeId: 48, text: "space-between", correct: false },
      { challengeId: 48, text: "spacing", correct: false },

      // 49
      { challengeId: 49, text: "SELECT", correct: true },
      { challengeId: 49, text: "GET", correct: false },
      { challengeId: 49, text: "FETCH", correct: false },
      // 50
      { challengeId: 50, text: "FROM", correct: true },
      { challengeId: 50, text: "TABLE", correct: false },
      { challengeId: 50, text: "IN", correct: false },
      // 51
      { challengeId: 51, text: "SELECT *", correct: true },
      { challengeId: 51, text: "SELECT ALL", correct: false },
      { challengeId: 51, text: "SELECT ()", correct: false },
      // 52
      { challengeId: 52, text: "DISTINCT", correct: true },
      { challengeId: 52, text: "UNIQUE", correct: false },
      { challengeId: 52, text: "NODUP", correct: false },

      // 53
      { challengeId: 53, text: "WHERE", correct: true },
      { challengeId: 53, text: "FILTER", correct: false },
      { challengeId: 53, text: "IF", correct: false },
      // 54
      { challengeId: 54, text: "BETWEEN", correct: true },
      { challengeId: 54, text: "RANGE", correct: false },
      { challengeId: 54, text: "WITHIN", correct: false },
      // 55
      { challengeId: 55, text: "AND", correct: true },
      { challengeId: 55, text: "OR", correct: false },
      { challengeId: 55, text: "ALL", correct: false },
      // 56
      { challengeId: 56, text: "LIKE", correct: true },
      { challengeId: 56, text: "MATCH", correct: false },
      { challengeId: 56, text: "SIMILAR", correct: false },

      // 57
      { challengeId: 57, text: "INNER JOIN", correct: true },
      { challengeId: 57, text: "LEFT JOIN", correct: false },
      { challengeId: 57, text: "FULL JOIN", correct: false },
      // 58
      { challengeId: 58, text: "LEFT JOIN", correct: true },
      { challengeId: 58, text: "INNER JOIN", correct: false },
      { challengeId: 58, text: "RIGHT JOIN", correct: false },
      // 59
      { challengeId: 59, text: "ON", correct: true },
      { challengeId: 59, text: "WHERE", correct: false },
      { challengeId: 59, text: "LINK", correct: false },
      // 60
      { challengeId: 60, text: "Primary key", correct: true },
      { challengeId: 60, text: "Foreign key", correct: false },
      { challengeId: 60, text: "Index", correct: false },

      // 61
      { challengeId: 61, text: "COUNT()", correct: true },
      { challengeId: 61, text: "SUM()", correct: false },
      { challengeId: 61, text: "TOTAL()", correct: false },
      // 62
      { challengeId: 62, text: "AVG()", correct: true },
      { challengeId: 62, text: "MEAN()", correct: false },
      { challengeId: 62, text: "AVERAGE()", correct: false },
      // 63
      { challengeId: 63, text: "GROUP BY", correct: true },
      { challengeId: 63, text: "ORDER BY", correct: false },
      { challengeId: 63, text: "CLUSTER BY", correct: false },
      // 64
      { challengeId: 64, text: "HAVING", correct: true },
      { challengeId: 64, text: "WHERE", correct: false },
      { challengeId: 64, text: "FILTER", correct: false },

      // 65
      { challengeId: 65, text: "int", correct: true },
      { challengeId: 65, text: "integer", correct: false },
      { challengeId: 65, text: "num", correct: false },
      // 66
      { challengeId: 66, text: "boolean", correct: true },
      { challengeId: 66, text: "bool", correct: false },
      { challengeId: 66, text: "bit", correct: false },
      // 67
      { challengeId: 67, text: ";", correct: true },
      { challengeId: 67, text: ".", correct: false },
      { challengeId: 67, text: ":", correct: false },
      // 68
      { challengeId: 68, text: "double", correct: true },
      { challengeId: 68, text: "int", correct: false },
      { challengeId: 68, text: "char", correct: false },

      // 69
      { challengeId: 69, text: "System.out.println()", correct: true },
      { challengeId: 69, text: "print()", correct: false },
      { challengeId: 69, text: "console.log()", correct: false },
      // 70
      { challengeId: 70, text: "public static void main(String[] args)", correct: true },
      { challengeId: 70, text: "def main():", correct: false },
      { challengeId: 70, text: "function main()", correct: false },
      // 71
      { challengeId: 71, text: "//", correct: true },
      { challengeId: 71, text: "#", correct: false },
      { challengeId: 71, text: "<!--", correct: false },
      // 72
      { challengeId: 72, text: "File name", correct: true },
      { challengeId: 72, text: "Package name", correct: false },
      { challengeId: 72, text: "Variable name", correct: false },

      // 73
      { challengeId: 73, text: "if", correct: true },
      { challengeId: 73, text: "when", correct: false },
      { challengeId: 73, text: "check", correct: false },
      // 74
      { challengeId: 74, text: "else", correct: true },
      { challengeId: 74, text: "otherwise", correct: false },
      { challengeId: 74, text: "elseif", correct: false },
      // 75
      { challengeId: 75, text: "switch", correct: true },
      { challengeId: 75, text: "case", correct: false },
      { challengeId: 75, text: "match", correct: false },
      // 76
      { challengeId: 76, text: "!=", correct: true },
      { challengeId: 76, text: "<>", correct: false },
      { challengeId: 76, text: "=/=", correct: false },

      // 77
      { challengeId: 77, text: "for", correct: true },
      { challengeId: 77, text: "while", correct: false },
      { challengeId: 77, text: "do-while", correct: false },
      // 78
      { challengeId: 78, text: "do-while", correct: true },
      { challengeId: 78, text: "for", correct: false },
      { challengeId: 78, text: "while", correct: false },
      // 79
      { challengeId: 79, text: "break", correct: true },
      { challengeId: 79, text: "stop", correct: false },
      { challengeId: 79, text: "exit", correct: false },
      // 80
      { challengeId: 80, text: "continue", correct: true },
      { challengeId: 80, text: "next", correct: false },
      { challengeId: 80, text: "skip", correct: false },
    ]);

    // Achievement catalog is stable reference data, not demo content — insert
    // idempotently instead of wiping it with the rest of the tables above, so
    // re-seeding doesn't erase anyone's unlock history.
    await db.insert(schema.achievements).values([
      {
        key: "first_lesson",
        title: "First Steps",
        description: "Answer your first question correctly",
        iconSrc: "/leaderboard.svg",
      },
      {
        key: "streak_3",
        title: "On a Roll",
        description: "Reach a 3-day streak",
        iconSrc: "/leaderboard.svg",
      },
      {
        key: "streak_7",
        title: "Committed",
        description: "Reach a 7-day streak",
        iconSrc: "/leaderboard.svg",
      },
      {
        key: "xp_100",
        title: "Century",
        description: "Earn 100 XP",
        iconSrc: "/leaderboard.svg",
      },
      {
        key: "xp_500",
        title: "High Achiever",
        description: "Earn 500 XP",
        iconSrc: "/leaderboard.svg",
      },
    ]).onConflictDoNothing();

    console.log("Seeding completed!");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

main();
