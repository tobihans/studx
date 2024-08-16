FROM python:3.11.9-bookworm

COPY pyproject.toml poetry.lock ./

RUN pip install --upgrade pip pipx
RUN pipx run poetry export -n --only main > requirements.txt
RUN pip install -r requirements.txt

WORKDIR /opt/app

COPY . ./

ENTRYPOINT ["sh", "/entrypoint.sh"]
