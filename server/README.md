Deployment usage
================

## Requirements
* Have [_nodejs_](https://nodejs.org/) installed

## Process
1. Go to the deploy folder

        $ cd deploy

2. Install dependencies

        $ npm install

3. Clean pevious builds (_optional_)

        $ gulp clear_build

3. Run the build process

        $ gulp build

4. Test results serving from the build folder

        $ gulp server_pro

5. Open a browser on **http://localhost:8080** and check that everything looks fine

## Implementation notes
* We are using the last commit found on the local git repo master branch to version the static files accordingly. Probably there should be a better way to locate the git commit but hell!! it works. (Any other way recommendations are more than welcomed through [github issue](https://github.com/lanacioncom/2015_paso_caba_mapa_candidatos/issues))
