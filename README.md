## 911 CFS Analytics Backend / API Project

This is a Django app built for the CFS Analytics project.

### Development instructions

You need to have both [VirtualBox](https://www.virtualbox.org) and [Vagrant](https://www.vagrantup.com) installed to proceed. To provision the database we are using Ansible, which works nicely with vagrant. You will need this installed locally: you can do so via Homebrew by running `brew install ansible`.

1. Clone this repository
2. In terminal, `cd` into the repository's directory.
3. Enter `vagrant up`. The first time you do this it will take ~ 30 minutes to pull down the VirtualBox image and provision the machine.
4. Once 3 is complete, run `vagrant ssh` to enter the shell of the virtual machine.
5. At this point you should be able to connect to the database with pgAdmin or any other PostgreSQL client on port 5433 as the user _datascientist_ with a password of _1234thumbwar_.

You'll notice that the repository contains the Django app. Vagrant is set to configure the VM to share the repository directory with your host OS. That means that you can develop on your computer with your preferred dev tools. However, you'll need to run the Django app from within the VM. Vagrant makes this easy.

If you are not in the VM, follow the steps above.

If you are in the VM, then do the following...

The first time:

1. `cd /vagrant`
2. `sudo pip3 install -r requirements.txt`

After that:

1. `cd /vagrant/cfsbackend` (this is the shared directory with the repository)
2. `python3 manage.py bower install` (installs front-end assets; only need to do this the first time/when assets change)
3. `python3 manage.py runserver_plus 0.0.0.0:8000 --settings=cfsbackend.settings.local` to use the development server or `gunicorn cfsbackend.wsgi -b 0.0.0.0:8000 --settings=cfsbackend.settings.prod` to use what we will use in production

To see whether Django is running properly, open a browser and point it to `localhost:8887` and you should see the app respond. The terminal where you have the VM open also should show that you hit the web app.

When you are done working for the day, use `ctrl-c` to quit Django in the VM. Type `exit` to exit the VM. Then type `vagrant halt` to gracefully shut down the VM. Check in your changes, push to the repository, etc... 

The next day, when you're ready to work again, simply follow these instructions again.

### Front-end assets

Front-end assets are managed by [Bower](http://bower.io). You have to run this in order to make the dashboard work.

1. `cd /vagrant/cfsbackend`
2. `python3 manage.py bower install`

### Notes for Windows 7 Users

* Running the VM in VirtualBox requires virtualization to be enabled in your BIOS. It may be disabled by default on RTI machines. If the VM fails to start after running `vagrant up`, try starting the VM directly via the VirtualBox GUI. An error with a message like "VT-x is disabled in the BIOS" indicates that you need to enter your machine's BIOS and enable virtualization. (The exact method for doing this will vary by motherboard.)

* The `vagrant ssh` command requires `ssh.exe` to be in your `PATH`. Because ssh is shipped with git, the easiest way to do this is to add `C:\programs\Git\bin` (or wherever you installed git) to your `PATH`. Another option is to use Putty with the connection information provided by the output of the `vagrant ssh` command. However, the private key file provided by Vagrant isn't compatible with Putty. You'll first need to open the key in puttygen and convert it to a `.ppk` file, then you can tell Putty to use that file for authenticating.

### Generating a database schema diagram

In `/working_files/datadocs` is a shell script called `update_schema_diagram.sh`. Edit/use it to create a diagram of the database. However, you will have to install [schemacrawler](http://sualeh.github.io/SchemaCrawler/) first.
