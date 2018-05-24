function SetIndexFiles {
    $f1 = Get-Item .\src\api\ | ForEach-Object { 'export * from "./Lists/' + $_.Name.Replace(".ts","") + '";' }
    $f2 = Get-Item .\src\api\Mock\* | ForEach-Object { 'export * from "./Mock/' + $_.Name.Replace(".ts","") + '";' }
    $f1 + "" + $f2 > .\src\api\index.ts

    $f1 = Get-Item .\src\interfaces\* | Where-Object {$_.Name -ne "index.ts"} | ForEach-Object { 'export * from "./' + $_.Name.Replace(".ts","") + '";' }
    $f1 > .\src\interfaces\index.ts
    $path = (Get-Item -Path ".\" -Verbose).FullName + "\src\api\index.ts"
    Remove-Item $path
    $f1 = Get-ChildItem .\src\api -Recurse -Attributes !Directory+!System  | Where-Object {$_.Name -ne "index.ts"} | ForEach-Object { 
        'export * from "./' + $_.Directory.Name.Replace("api", "") + "/" + $_.BaseName + '";' 
    }
    New-Item $path -type file 
    $f1 | ForEach-Object { Add-Content $path $_.Replace("//", "/") }


    $path = (Get-Item -Path ".\" -Verbose).FullName + "\src\interfaces\index.ts"
    Remove-Item $path
    $f1 = Get-ChildItem .\src\interfaces -Recurse -Attributes !Directory+!System  | Where-Object {$_.Name -ne "index.ts"} | ForEach-Object { 
        'export * from "./' + $_.Directory.Name.Replace("interfaces", "") + "/" + $_.BaseName + '";' 
    }
    New-Item $path -type file 
    $f1 | ForEach-Object { Add-Content $path $_.Replace("//", "/") }

    $path = (Get-Item -Path ".\" -Verbose).FullName + "\src\services\index.ts"
    Remove-Item $path
    $f1 = Get-ChildItem .\src\services -Recurse -Attributes !Directory+!System  | Where-Object {$_.Name -ne "index.ts"} | ForEach-Object { 
        'export * from "./' + $_.Directory.Name.Replace("services", "") + "/" + $_.BaseName + '";' 
    }
    New-Item $path -type file 
    $f1 | ForEach-Object { Add-Content $path $_.Replace("//", "/") }

    #get-childItem .\src\controls -Filter "*AsyncDropdown*" -recurse | rename-item -newname { $_.Name -replace "AsyncDropdown","AsyncChoice" }
}

function SetLmsApp{
    Param(
    [parameter(Mandatory=$true)]
    [String]
    $deploymentType 
    )
    
    If ($deployementType -eq 'prod'){
    Get-ChildItem -Path ".\config" -filter "*-prod.json" | Copy-Item -Destination {$_.FullName -replace '-prod.json', '.json'} 
    }
    ELSE{
    Get-ChildItem -Path ".\config" -filter "*-dev.json" | Copy-Item -Destination {$_.FullName -replace '-dev.json', '.json'} 
    }
}
#SetLmsApp -deploymentType prod
#SetLmsApp -deploymentType dev
cls
SetIndexFiles
