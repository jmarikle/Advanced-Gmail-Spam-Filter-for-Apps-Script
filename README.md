<!-- Improved compatibility of back to top link: See: https://github.com/othneildrew/Best-README-Template/pull/73 -->
<a name="readme-top"></a>
<!--
*** Thanks for checking out the Best-README-Template. If you have a suggestion
*** that would make this better, please fork the repo and create a pull request
*** or simply open an issue with the tag "enhancement".
*** Don't forget to give the project a star!
*** Thanks again! Now go create something AMAZING! :D
-->



<!-- PROJECT SHIELDS -->
<!--
*** I'm using markdown "reference style" links for readability.
*** Reference links are enclosed in brackets [ ] instead of parentheses ( ).
*** See the bottom of this document for the declaration of the reference variables
*** for contributors-url, forks-url, etc. This is an optional, concise syntax you may use.
*** https://www.markdownguide.org/basic-syntax/#reference-style-links
-->
[![clasp][clasp-shield]][clasp-url]


<!-- PROJECT LOGO -->
<br />
<div align="center">
<h3 align="center">Advanced Gmail Spam Filter for Apps Script</h3>

  <p align="center">
    This is an advanced filtering script for gmail.  There's a very
    good chance that I'm the only one that can ever use this script,
    but in the interest of helping others implementing clasp with
    webpack, node modules, and other nuances, I've made this
    repository available publicly.
    <br />
    <br />
    <a href="https://github.com/jmarikle/Advanced-Gmail-Spam-Filter-for-Apps-Script"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://github.com/jmarikle/Advanced-Gmail-Spam-Filter-for-Apps-Script">View Demo</a>
    ·
    <a href="https://github.com/jmarikle/Advanced-Gmail-Spam-Filter-for-Apps-Script/issues">Report Bug</a>
    ·
    <a href="https://github.com/jmarikle/Advanced-Gmail-Spam-Filter-for-Apps-Script/issues">Request Feature</a>
  </p>
</div>



<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
  </ol>
</details>



<!-- GETTING STARTED -->
## Getting Started

This script relies on `npm`, `clasp`, and `webpack` to name a few.
[Clasp][clasp-url] is how this project is published to google apps
script, but some configuration is needed before it can be deployed.
Additionally, it is possible to run methods found in Code.js from the
command line, but it does require additional steps.

### Prerequisites

Install npm and the latest version of clasp.  This is optional, but
it makes it easier to execute commands like `clasp run`.

* npm
  ```sh
  npm install npm@latest -g
  ```

* clasp
  ```sh
  npm install @google/clasp -g
  ```

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/jmarikle/Advanced-Gmail-Spam-Filter-for-Apps-Script.git
   ```
2. Install NPM packages
   ```sh
   npm install
   ```
3. Configure `clasp`
   ```sh
   clasp create --title "Advanced Spam Filter" --type standalone --rootDir dist
   ```

4. Modify `.clasp.json` to push `FilterSpam.js` first.  This is how
   we get node modules and our business logic to pull in to `Code.js`
   ```json
   {
     "scriptId":"<SCRIPT_ID_GENERATED_BY_CLASP>",
     "rootDir":"dist",
     "filePushOrder":["dist/FilterSpam.js"]
   }
   ```

5. build the `FilterSpam.js` file
   ```sh
   npm run build
   ```

6. Push to GAS
   ```sh
   clasp push
   clasp open
   ```

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- USAGE EXAMPLES -->
## Usage

In order to add rules to the script, you will need to use `clasp run`.
This is an advanced feature of clasp that will require multiple steps
to configure.  You will need to follow the instructions [here](https://github.com/google/clasp#run) before
you can run the command needed to add a rule.  Once you can run
functions via `clasp run`, run the command below to add a rule

* add a rule for filtering raw content based on the existence of a
  wish.com link in the message body
  ```sh
  clasp run addRule -p '["content", "wish\\.com"]'
  ```

* add a rule for filtering based on subject using a case insensitive
  flag
  ```sh
  clasp run addRule -p '["subject", "Please confirm receipt", "i"]'
  ```

* you can also set rules in bulk, but this isn't exactly recommended
  ```sh
  clasp run setRules -p '[{"ip":[["194\\.106\\.216\\.130"]],"from":[["wish\\.com"],["[a-z0-9]yelp\\.com/","i"],["atari\\.com"],["ataribox"]],"subject":[["Зачисление"]],"content":[["newsletterSUBSCRIBEMORE"],"to":[["^\\-\\-><\\-\\-$"]]}]'
  ```

Generally rules should never be removed and new ones only added on
rather than replaced.  This is because a label is added to the spam
message so you can trace back which rule triggered sending it to spam.
Because this is dynamic, it relies on the array index of the rule.
Removing an item would cause the index to potentially be incorrect.


Once your rules are in place, you can set up a time-based trigger to
execute `runSpamFilter`

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[clasp-shield]: https://img.shields.io/badge/built%20with-clasp-4285f4.svg
[clasp-url]: https://github.com/google/clasp
