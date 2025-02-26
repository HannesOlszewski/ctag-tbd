ARG TBD_IDF_VERSION=v5.4


#### c++ build ####

FROM espressif/idf:release-${TBD_IDF_VERSION} AS esp_idf_stage

# tbd specifc configs
ENV TBD_ENV_NO_TBD_CMD=0
ENV TBD_ENV_NO_IDF_CMD=0
ARG TBD_PATH=/opt/tbd
ENV TBD_IDF_PATH=/opt/esp/idf

# non config vars
ENV LC_ALL=C.UTF-8
ENV LANG=C.UTF-8
ENV TBD_IN_CONTAINER=1
ARG TBD_IDF_ACTIVATE=$TBD_IDF_PATH/export.sh
ARG TBD_INIT=$TBD_PATH/tbd-init.sh

RUN apt-get update -y && apt-get install -y \
    udev \
    software-properties-common \
    alsa-utils \
    bash-completion \
    pulseaudio \
    libpixman-1-0 \
    libsdl2-2.0-0 \
    libslirp0 \
    libboost-all-dev \
    libasound2-dev \
    libglib2.0-dev \
    libgcrypt20-dev \
    fish \
    micro

COPY ./tbd-init.sh "$TBD_PATH/"
ENV PATH="$PATH:$TBD_PATH"
RUN "$TBD_INIT" integrate-idf
RUN "$TBD_INIT" install-clang

ENTRYPOINT [ "/opt/esp/entrypoint.sh" ]
CMD ["/bin/bash", "-c"]

#### tbd build tool ####

# required to build TBD software
FROM esp_idf_stage AS tbd_build_stage

RUN . "$TBD_IDF_ACTIVATE" && pip install \
    typer \
    cxxheaderparser \
    jinja2 \
    GitPython \
    loguru \
    pyhumps \
    pydantic \
    pyyaml

ENTRYPOINT [ "/opt/esp/entrypoint.sh" ]
CMD ["/bin/bash", "-c"]


#### docs build tools ####

FROM tbd_build_stage AS sphinx_docs_stage

RUN apt-get install -y \
    doxygen

RUN . "$TBD_IDF_ACTIVATE" && pip install \
    sphinx \
    pydata-sphinx-theme \
    sphinxcontrib-youtube \
    esbonio \
    breathe

ENTRYPOINT [ "/opt/esp/entrypoint.sh" ]
CMD ["/bin/bash", "-c"]


#### qemu for esp32 ####

FROM sphinx_docs_stage AS quemu_latest_stage

RUN cd /opt \
		&& git clone --quiet https://github.com/espressif/qemu.git \
		&& cd qemu \
		&& mkdir -p build \
		&& cd build \
		&& ../configure --target-list=xtensa-softmmu --without-default-features --enable-slirp  --enable-gcrypt \
		&& make -j $(nproc) vga=no \
		&& make install

ENTRYPOINT [ "/opt/esp/entrypoint.sh" ]
CMD ["/bin/bash", "-c"]


#### c++ package manger  ####

# required to generate TBD documentation
#FROM quemu_latest_stage AS tbd_package_manager_stage
#
#ENV TBD_ENV_NO_VCPKG=0
#ENV VCPKG_ROOT=/opt/vcpkg
#
#RUN "$TBD_INIT" install-vcpkg && "$TBD_INIT" integrate-vcpkg

#ENTRYPOINT [ "/opt/esp/entrypoint.sh" ]
#CMD ["/bin/bash", "-c"]
