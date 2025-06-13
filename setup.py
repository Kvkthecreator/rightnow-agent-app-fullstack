from setuptools import setup, find_packages

setup(
    name="rightnow-agent-app",
    version="0.0.9",
    packages=find_packages(where="api"),
    package_dir={"": "api"},
    install_requires=[],
    include_package_data=True,
)
