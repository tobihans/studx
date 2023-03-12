#!/usr/bin/env bash

install_dependencies() {
    cd "$1" || exit

    # Node dependencies
    if [ -f "package.json" ]
    then
        pnpm install;
    fi

    # Python dependencies
    if [ -f pyproject.toml ]
    then
        poetry install
    fi

    if [ -f requirement.txt ]
    then
        python3 -m venv .venv;
        source .venv/bin/activate;
        pip install -r requirement.txt;
    fi

    # Rust dependencies
    if [ -f Cargo.toml ]
    then
        cargo build;
    fi

}

for dir_item in *
do
    if [ -d "$dir_item" ]
    then
        if [[ "$dir_item" = "scripts" ]]; then continue; fi
        echo -e "\n=== INSTALLING DEPENDENCIES FOR \`$dir_item\`";
        (install_dependencies "$dir_item");
    fi
done
