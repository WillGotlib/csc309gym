echo "MAKE SURE TO RUN THIS WITH source startup.sh"

if [ -d ".venv/" ] 
then
    echo "Virtual Environment already installed."
	#python3 -m venv .venv 
else
    echo "Creating venv"
	python3 -m venv .venv
    # echo "Virtual Environment already installed."
fi

SCRIPT=$(readlink -f $0)
SCRIPTPATH=`dirname $SCRIPT`
echo $SCRIPTPATH
source .venv/bin/activate

# BACKEND SETUP
cd PB/csc309project
pip install -r requirements.txt 
python3 manage.py makemigrations accounts studios
python3 manage.py migrate

cd ../..

# FRONTEND SETUP
cd csc309project
npm install --force

# Nothing to be done?

cd ..