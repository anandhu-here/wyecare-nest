@echo off
setlocal enabledelayedexpansion

:: Check if module name is provided
if "%~1"=="" (
    echo Usage: generate-module.bat [module-name]
    exit /b 1
)

:: Set module name from argument
set MODULE_NAME=%~1

:: Base path where the module will be created
set BASE_PATH=libs\api\features\src\lib\%MODULE_NAME%

:: Create main directory structure
mkdir "%BASE_PATH%"
mkdir "%BASE_PATH%\controllers"
mkdir "%BASE_PATH%\dto"
mkdir "%BASE_PATH%\services"

:: Create controller file
echo // %MODULE_NAME%.controller.ts > "%BASE_PATH%\controllers\%MODULE_NAME%.controller.ts"

:: Create DTO files
echo // calculate-%MODULE_NAME%.dto.ts > "%BASE_PATH%\dto\calculate-%MODULE_NAME%.dto.ts"
echo // create-%MODULE_NAME%.dto.ts > "%BASE_PATH%\dto\create-%MODULE_NAME%.dto.ts"
echo // generate-%MODULE_NAME%-pdf.dto.ts > "%BASE_PATH%\dto\generate-%MODULE_NAME%-pdf.dto.ts"
echo // %MODULE_NAME%-filter.dto.ts > "%BASE_PATH%\dto\%MODULE_NAME%-filter.dto.ts"
echo // update-%MODULE_NAME%-status.dto.ts > "%BASE_PATH%\dto\update-%MODULE_NAME%-status.dto.ts"

:: Create service file
echo // %MODULE_NAME%.service.ts > "%BASE_PATH%\services\%MODULE_NAME%.service.ts"

:: Create module file
echo // %MODULE_NAME%.module.ts > "%BASE_PATH%\%MODULE_NAME%.module.ts"

echo Module structure for '%MODULE_NAME%' created successfully at %BASE_PATH%