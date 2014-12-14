dorothy-demo
============

Demo application for the Dorothy cluster: http://clusterdorothy.com

---

## Setup

This project is a simple Flask server, which invokes Routino's APIs, parses them and returns simpler results for client-side applications.
It's recommended to use *virtual environments* when installing Python libraries and this project shouldn't be an exception.

Flask's [installation documentation](http://flask.pocoo.org/docs/0.10/installation) can help you setting up `pyenv` and `virtualenv`, helping you keep your computer/server tidy.

### Requirements

- Routino instance running somewhere (check [**this project**](https://github.com/OneStopTransport/routino-vagrant) if you want a Vagrant machine)
- Python 2.7 (we recommend the use of [`pyenv`](https://github.com/yyuu/pyenv))
- Command line shell/terminal

Besides `pyenv` and `virtualenv` (which are not mandatory, but should be used), we need some libraries in order to run this project. So, assuming you have created a virtual environment and are using it, run the following command:

```
# Assuming you have cloned this project into your filesystem...
# And have changed to its directory.
pip install -r requirements.pip
```

If no problem occurred, you're all set.

### Usage

```
# Assuming again you're on the project directory
python -m src.server
```

If you see the following message in your terminal...

```
* Running on http://127.0.0.1:5000/
* Restarting with reloader
```

... it means you're all set, head to the given URL in your favourite browser and confirm you can see a "Hello, world" kind of message.

---

## APIs/URLs documentation

TBA

---

## Issues/Troubleshooting

Feel free to contact us or create a new issue on this repository. We'll do our best to try and help!
