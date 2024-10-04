1. npm i
2. configure .env to set backend adress properly
3. npm run start

# Photobooth launch in linux
enable service for boot : sudo systemctl enable photobooth.service
restart service : sudo systemctl restart photobooth.service
start service : sudo systemctl start photobooth.service
stop service : sudo systemctl stop photobooth.service
status of service : systemctl status photobooth.service 
edit service script : sudo vi /etc/systemd/system/photobooth.service
edit launch script : sudo vi /usr/local/bin/launch_photobooth.sh