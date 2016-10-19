# find-iphone-7
simple CLI to check for available iphone 7's near you. Built bc I didn't want to have to keep checking the site to see when there'd be an iphone 7 available in my area. 

install: 

```shell
λ yarn global add find-iphone-7
```
or

```shell
λ npm i -g find-iphone-7
```

## Example
Find black iphone 7 plus's in my zipcode w/ ATT

```shell
λ find-iphone-7 --zip 12345 --model plus --color black --capacity 256 --carrier att --watch --notify
```

## Usage

```shell
λ find-iphone-7 --zip 12345 --model plus --color black --capacity 256 --carrier att --watch --notify
```

CLI Params: 
```
--zip [zip number]
--model [seven | plus string]
--carrier [att | verizon | tmobile | sprint  string]
--color [jetBlack | black | gold | silver | rose string]
--capacity [32 | 128 | 256 number]

--watch runs a check every minute
--notify will send you a text message when there's one available
```


If you provide the notify flag, you need to set up an iphone.yaml file that'll let twilio send you a text w/ the info about

```yaml
TWILIO_ACCOUNT: <account>
TWILIO_TOKEN: <token>
TO_NUMBER: <your number>
FROM_NUMBER: <your twilio number>
```

