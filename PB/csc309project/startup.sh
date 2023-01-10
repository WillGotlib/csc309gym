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
pip install -r requirements.txt

python3 manage.py makemigrations accounts studios
python3 manage.py migrate
