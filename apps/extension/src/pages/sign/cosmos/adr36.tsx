import React, { FunctionComponent, useMemo, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import { useStore } from "../../../stores";
import { useInteractionInfo } from "../../../hooks";
import { HeaderLayout } from "../../../layouts/header";
import { BackButton } from "../../../layouts/header/components";
import { checkAndValidateADR36AminoSignDoc } from "@keplr-wallet/cosmos";
import { Box } from "../../../components/box";
import { Gutter } from "../../../components/gutter";
import { ColorPalette } from "../../../styles";
import { handleCosmosPreSign } from "../utils/handle-cosmos-sign";
import { KeplrError } from "@keplr-wallet/router";
import { ErrModuleLedgerSign } from "../utils/ledger-types";
import { LedgerGuideBox } from "../components/ledger-guide-box";
import { GuideBox } from "../../../components/guide-box";
import { useIntl } from "react-intl";
import { ErrModuleKeystoneSign, KeystoneUR } from "../utils/keystone";
import { KeystoneSign } from "../components/keystone";
import { useTheme } from "styled-components";
import { KeyRingService } from "@keplr-wallet/background";
import { handleExternalInteractionWithNoProceedNext } from "../../../utils";
import { KeystoneUSBBox } from "../components/keystone-usb-box";
import { useNavigate } from "react-router";
import { ApproveIcon, CancelIcon } from "../../../components/button";
import { Adr36RequestOrigin } from "../components/adr36/adr36-request-origin";
import { Adr36SignHeader } from "../components/adr36/adr36-header";
import { Adr36WalletDetails } from "../components/adr36/adr36-wallet-details";
import { Adr36DataView } from "../components/adr36/adr36-data-view";

export const SignCosmosADR36Page: FunctionComponent = observer(() => {
  const { chainStore, signInteractionStore, uiConfigStore, accountStore } =
    useStore();
  const intl = useIntl();
  const theme = useTheme();
  const navigate = useNavigate();

  const interactionInfo = useInteractionInfo({
    onWindowClose: () => {
      signInteractionStore.rejectAll();
    },
    onUnmount: async () => {
      if (signInteractionStore.waitingData) {
        signInteractionStore.rejectWithProceedNext(
          signInteractionStore.waitingData.id,
          () => {}
        );
      }
    },
  });

  if (
    signInteractionStore.waitingData &&
    !signInteractionStore.waitingData.data.signDocWrapper.isADR36SignDoc
  ) {
    throw new Error("Sign doc is not for adr36");
  }

  const signDocWrapper = signInteractionStore.waitingData?.data.signDocWrapper;
  const isADR36WithString = (() => {
    if (
      signInteractionStore.waitingData?.data.signOptions &&
      "isADR36WithString" in signInteractionStore.waitingData.data.signOptions
    ) {
      return (
        signInteractionStore.waitingData.data.signOptions.isADR36WithString ||
        false
      );
    }
    return false;
  })();
  const content: {
    value: string;
    isJSON: boolean;
  } = useMemo(() => {
    if (!signDocWrapper) {
      return {
        value: "",
        isJSON: false,
      };
    }

    if (signDocWrapper.aminoSignDoc.msgs.length !== 1) {
      throw new Error("Sign doc is improper ADR-36");
    }

    const msg = signDocWrapper.aminoSignDoc.msgs[0];
    if (msg.type !== "sign/MsgSignData") {
      throw new Error("Sign doc is improper ADR-36");
    }

    if (isADR36WithString) {
      const str = Buffer.from(msg.value.data, "base64").toString();

      try {
        // In case of json, it is displayed more easily to read.
        return {
          value: JSON.stringify(JSON.parse(str), null, 2),
          isJSON: true,
        };
      } catch {
        return {
          value: str,
          isJSON: false,
        };
      }
    } else {
      return {
        value: msg.value.data as string,
        isJSON: false,
      };
    }
  }, [isADR36WithString, signDocWrapper]);

  const isLedgerAndDirect =
    signInteractionStore.waitingData?.data.keyType === "ledger" &&
    signInteractionStore.waitingData?.data.mode === "direct";

  const [isLedgerInteracting, setIsLedgerInteracting] = useState(false);
  const [ledgerInteractingError, setLedgerInteractingError] = useState<
    Error | undefined
  >(undefined);

  const isKeystoneUSB =
    signInteractionStore.waitingData?.data.keyType === "keystone" &&
    signInteractionStore.waitingData?.data.keyInsensitive["connectionType"] ===
      "USB";

  const [isKeystoneInteracting, setIsKeystoneInteracting] = useState(false);
  const [keystoneUR, setKeystoneUR] = useState<KeystoneUR>();
  const keystoneScanResolve = useRef<(ur: KeystoneUR) => void>();
  const [keystoneInteractingError, setKeystoneInteractingError] = useState<
    Error | undefined
  >(undefined);

  const isLoading =
    signInteractionStore.isObsoleteInteractionApproved(
      signInteractionStore.waitingData?.id
    ) ||
    isLedgerInteracting ||
    isKeystoneInteracting;
  const chainId: string = signInteractionStore.waitingData?.data.chainId || "";
  const account = accountStore.getAccount(chainId);

  return (
    <HeaderLayout
      title={""}
      headerContainerStyle={{
        height: "0",
      }}
      contentContainerStyle={{
        paddingTop: "2rem",
      }}
      fixedHeight={true}
      left={
        <BackButton
          hidden={
            interactionInfo.interaction && !interactionInfo.interactionInternal
          }
        />
      }
      bottomButtons={[
        {
          textOverrideIcon: (
            <CancelIcon
              color={
                theme.mode === "light"
                  ? ColorPalette["blue-400"]
                  : ColorPalette["gray-200"]
              }
            />
          ),
          size: "large",
          color: "secondary",
          style: {
            width: "3.25rem",
          },
          onClick: async () => {
            if (signInteractionStore.waitingData) {
              signInteractionStore.rejectWithProceedNext(
                signInteractionStore.waitingData.id,
                (proceedNext) => {
                  if (!proceedNext) {
                    if (
                      interactionInfo.interaction &&
                      !interactionInfo.interactionInternal
                    ) {
                      handleExternalInteractionWithNoProceedNext();
                    } else if (
                      interactionInfo.interaction &&
                      interactionInfo.interactionInternal
                    ) {
                      window.history.length > 1 ? navigate(-1) : navigate("/");
                    } else {
                      navigate("/", { replace: true });
                    }
                  }
                }
              );
            }
          },
        },
        {
          text: intl.formatMessage({ id: "button.approve" }),
          color: "primary",
          size: "large",
          left: !isLoading && <ApproveIcon />,
          disabled: signInteractionStore.waitingData == null,
          isLoading,
          onClick: async () => {
            if (signInteractionStore.waitingData) {
              const signDocWrapper =
                signInteractionStore.waitingData.data.signDocWrapper;

              if (
                signDocWrapper.mode !== "amino" ||
                !checkAndValidateADR36AminoSignDoc(
                  signDocWrapper.aminoSignDoc,
                  chainStore.getChain(
                    signInteractionStore.waitingData.data.chainId
                  ).bech32Config?.bech32PrefixAccAddr
                )
              ) {
                throw new Error("Invalid sign doc for adr36");
              }

              let presignOptions;
              if (signInteractionStore.waitingData.data.keyType === "ledger") {
                setIsLedgerInteracting(true);
                setLedgerInteractingError(undefined);
                presignOptions = {
                  useWebHID: uiConfigStore.useWebHIDLedger,
                };
              } else if (
                signInteractionStore.waitingData.data.keyType === "keystone"
              ) {
                setIsKeystoneInteracting(true);
                setKeystoneInteractingError(undefined);
                const isEthSigning = KeyRingService.isEthermintLike(
                  chainStore.getChain(
                    signInteractionStore.waitingData.data.chainId
                  )
                );
                presignOptions = {
                  isEthSigning,
                  displayQRCode: async (ur: KeystoneUR) => {
                    setKeystoneUR(ur);
                  },
                  scanQRCode: () =>
                    new Promise<KeystoneUR>((resolve) => {
                      keystoneScanResolve.current = resolve;
                    }),
                };
              }

              try {
                const signature = await handleCosmosPreSign(
                  signInteractionStore.waitingData,
                  signDocWrapper,
                  presignOptions
                );

                await signInteractionStore.approveWithProceedNext(
                  signInteractionStore.waitingData.id,
                  signDocWrapper,
                  signature,
                  (proceedNext) => {
                    if (!proceedNext) {
                      if (
                        interactionInfo.interaction &&
                        !interactionInfo.interactionInternal
                      ) {
                        handleExternalInteractionWithNoProceedNext();
                      }
                    }
                  }
                );
              } catch (e) {
                console.log(e);

                if (e instanceof KeplrError) {
                  if (e.module === ErrModuleLedgerSign) {
                    setLedgerInteractingError(e);
                  } else if (e.module === ErrModuleKeystoneSign) {
                    setKeystoneInteractingError(e);
                  } else {
                    setLedgerInteractingError(undefined);
                    setKeystoneInteractingError(undefined);
                  }
                } else {
                  setLedgerInteractingError(undefined);
                  setKeystoneInteractingError(undefined);
                }
              } finally {
                setIsLedgerInteracting(false);
                setIsKeystoneInteracting(false);
              }
            }
          },
        },
      ]}
    >
      <Box
        height="100%"
        paddingX="0.75rem"
        //NOTE - In light mode, the simplebar has shadow, but if there is no bottom margin,
        // it feels like it gets cut off, so I arbitrarily added about 2px.
        paddingBottom="0.125rem"
        style={{
          overflow: "auto",
        }}
      >
        <Adr36SignHeader />
        <Gutter size="0.75rem" />
        <Adr36RequestOrigin
          origin={signInteractionStore.waitingData?.data.origin || ""}
        />

        <Gutter size="1.5rem" />
        {chainId && (
          <Adr36WalletDetails
            walletName={account?.name || ""}
            chainInfo={chainStore.getChain(chainId)}
            addressInfo={{
              type: "bech32",
              address: account.bech32Address,
            }}
          />
        )}

        <Gutter size="1.5rem" />
        <Adr36DataView
          message={content.value}
          rawMessage={JSON.stringify(signDocWrapper?.aminoSignDoc, null, 2)}
        />

        <div style={{ flex: 1 }} />

        {isLedgerAndDirect ? (
          <React.Fragment>
            <Gutter size="0.75rem" />
            <GuideBox
              color="warning"
              title={intl.formatMessage({
                id: "page.sign.adr36.warning-title",
              })}
              paragraph={intl.formatMessage({
                id: "page.sign.adr36.warning-paragraph",
              })}
            />
          </React.Fragment>
        ) : null}

        {signInteractionStore.waitingData ? (
          <LedgerGuideBox
            data={{
              keyInsensitive:
                signInteractionStore.waitingData.data.keyInsensitive,
              isEthereum:
                "eip712" in signInteractionStore.waitingData.data &&
                signInteractionStore.waitingData.data.eip712 != null,
            }}
            isLedgerInteracting={isLedgerInteracting}
            ledgerInteractingError={ledgerInteractingError}
            isInternal={signInteractionStore.waitingData.isInternal}
          />
        ) : null}
        {isKeystoneUSB && (
          <KeystoneUSBBox
            isKeystoneInteracting={isKeystoneInteracting}
            KeystoneInteractingError={keystoneInteractingError}
          />
        )}
      </Box>
      {!isKeystoneUSB && (
        <KeystoneSign
          ur={keystoneUR}
          isOpen={isKeystoneInteracting}
          close={() => {
            setIsKeystoneInteracting(false);
          }}
          onScan={(ur) => {
            if (keystoneScanResolve.current === undefined) {
              throw new Error("Keystone Scan Error");
            }
            keystoneScanResolve.current(ur);
          }}
          error={keystoneInteractingError}
          onCloseError={() => {
            if (keystoneInteractingError) {
              setIsKeystoneInteracting(false);
            }
            setKeystoneInteractingError(undefined);
          }}
        />
      )}
    </HeaderLayout>
  );
});
